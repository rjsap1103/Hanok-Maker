import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// public/ 정적 파일 서빙 (이미지, 3D 에셋, 영상 등)
const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath));

// =============================================================================
// 1. DESIGNS API 라우트
// =============================================================================

/**
 * GET /api/designs
 * 전체 한옥 작품 목록 조회 (최신 등록순)
 */
app.get('/api/designs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.execute(`
      SELECT id, title, description, thumbnail, created_at, updated_at
      FROM designs
      ORDER BY updated_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('[API Error] GET /api/designs:', error);
    res.status(500).json({ error: '작품 목록을 불러오는 중 오류가 발생했습니다.', details: error.message });
  }
});

/**
 * GET /api/designs/:id
 * 특정 한옥 작품 상세 조회 (결구 design_data 포함)
 */
app.get('/api/designs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.execute({
      sql: 'SELECT * FROM designs WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: '해당 ID의 작품을 찾을 수 없습니다.' });
      return;
    }

    const design = result.rows[0];
    // design_data JSON 문자열을 파싱하여 클라이언트에 객체로 전달 (또는 raw 전달)
    let parsedData;
    try {
      parsedData = typeof design.design_data === 'string' ? JSON.parse(design.design_data) : design.design_data;
    } catch {
      parsedData = design.design_data;
    }

    res.status(200).json({
      ...design,
      design_data: parsedData,
    });
  } catch (error: any) {
    console.error(`[API Error] GET /api/designs/${req.params.id}:`, error);
    res.status(500).json({ error: '작품 조회 중 오류가 발생했습니다.', details: error.message });
  }
});

/**
 * POST /api/designs
 * 새 한옥 작품 저장
 */
app.post('/api/designs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, title, description, thumbnail, design_data } = req.body;

    if (!title || !design_data) {
      res.status(400).json({ error: 'title과 design_data는 필수 항목입니다.' });
      return;
    }

    const designId = id || `design_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const serializedData = typeof design_data === 'object' ? JSON.stringify(design_data) : design_data;

    await db.execute({
      sql: `
        INSERT INTO designs (id, title, description, thumbnail, design_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        designId,
        title,
        description || '',
        thumbnail || '',
        serializedData,
        now,
        now,
      ],
    });

    res.status(201).json({
      success: true,
      id: designId,
      message: '새 한옥 설계 작품이 성공적으로 저장되었습니다.',
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/designs:', error);
    res.status(500).json({ error: '작품 저장 중 오류가 발생했습니다.', details: error.message });
  }
});

/**
 * PUT /api/designs/:id
 * 특정 한옥 작품 수정
 */
app.put('/api/designs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, thumbnail, design_data } = req.body;

    const existing = await db.execute({
      sql: 'SELECT id FROM designs WHERE id = ?',
      args: [id],
    });

    if (existing.rows.length === 0) {
      res.status(404).json({ error: '수정할 작품이 존재하지 않습니다.' });
      return;
    }

    const now = new Date().toISOString();
    const serializedData = design_data
      ? typeof design_data === 'object'
        ? JSON.stringify(design_data)
        : design_data
      : null;

    // 업데이트 쿼리 실행
    await db.execute({
      sql: `
        UPDATE designs
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            thumbnail = COALESCE(?, thumbnail),
            design_data = COALESCE(?, design_data),
            updated_at = ?
        WHERE id = ?
      `,
      args: [title || null, description || null, thumbnail || null, serializedData, now, id],
    });

    res.status(200).json({
      success: true,
      message: '한옥 설계 작품이 성공적으로 수정되었습니다.',
    });
  } catch (error: any) {
    console.error(`[API Error] PUT /api/designs/${req.params.id}:`, error);
    res.status(500).json({ error: '작품 수정 중 오류가 발생했습니다.', details: error.message });
  }
});

/**
 * DELETE /api/designs/:id
 * 특정 한옥 작품 삭제
 */
app.delete('/api/designs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await db.execute({
      sql: 'DELETE FROM designs WHERE id = ?',
      args: [id],
    });

    if (result.rowsAffected === 0) {
      res.status(404).json({ error: '삭제할 작품을 찾을 수 없습니다.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: '한옥 설계 작품이 성공적으로 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error(`[API Error] DELETE /api/designs/${req.params.id}:`, error);
    res.status(500).json({ error: '작품 삭제 중 오류가 발생했습니다.', details: error.message });
  }
});

// =============================================================================
// 2. AI CONTENTS API 라우트
// =============================================================================

/**
 * GET /api/ai-content
 * AI 생성 콘텐츠 목록 조회
 */
app.get('/api/ai-content', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;

    let result;
    if (category && category !== 'ALL') {
      result = await db.execute({
        sql: 'SELECT * FROM ai_contents WHERE category = ? ORDER BY created_at DESC',
        args: [category],
      });
    } else {
      result = await db.execute('SELECT * FROM ai_contents ORDER BY created_at DESC');
    }

    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('[API Error] GET /api/ai-content:', error);
    res.status(500).json({ error: 'AI 콘텐츠 목록을 불러오는 중 오류가 발생했습니다.', details: error.message });
  }
});

/**
 * GET /api/ai-content/:id
 * 특정 AI 콘텐츠 상세 조회
 */
app.get('/api/ai-content/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.execute({
      sql: 'SELECT * FROM ai_contents WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: '해당 AI 콘텐츠를 찾을 수 없습니다.' });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error(`[API Error] GET /api/ai-content/${req.params.id}:`, error);
    res.status(500).json({ error: 'AI 콘텐츠 조회 중 오류가 발생했습니다.', details: error.message });
  }
});

// 서버 시작 함수
export async function startServer(): Promise<void> {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`[Hanok API Server]: Server running on http://localhost:${PORT}`);
  });
}

// 서버 자동 구동
startServer().catch((err) => {
  console.error('[Hanok API Server Error] Startup failed:', err);
});

export default app;
