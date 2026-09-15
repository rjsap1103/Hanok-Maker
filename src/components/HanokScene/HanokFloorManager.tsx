import React from 'react';
import { useBuildStore } from '../../store';

// 마루(바닥) 원목 데크의 두께 (8cm)
const FLOOR_THICKNESS = 0.08;

/**
 * [한옥 바닥 관리 매니저 (HanokFloorManager)]
 * -------------------------------------------------------------
 * 1. 배치된 주춧돌들의 최외곽 범위를 감지하여 마루(바닥)를 자동으로 생성합니다.
 * 2. 주춧돌이 추가/삭제/이동되면 실시간으로 바닥 크기와 중심 좌표가 재계산됩니다.
 * 3. 3가지 전통 바닥 재질을 지원합니다:
 *    - wood: 대청마루 / 우물마루 (원목 널판 줄눈 표현)
 *    - ondol: 온돌방 콩기름 장판 (전통 한지 장판 격자선 표현)
 *    - earth: 다진 황토 마당 흙바닥
 * 4. 바닥을 클릭하면 우측 하단 ComponentInfo 패널에서 재질을 즉시 교체할 수 있습니다.
 */
export const HanokFloorManager: React.FC = () => {
  // 스토어에서 바닥 메쉬 정보와 현재 선택된 3D 오브젝트 가져오기
  const floorMesh = useBuildStore((state) => state.floorMesh);
  const selectedObject = useBuildStore((state) => state.selectedObject);
  const selectObject = useBuildStore((state) => state.selectObject);

  // 주춧돌이 없거나 바닥이 비활성화 상태면 렌더링하지 않음
  if (!floorMesh || !floorMesh.visible) return null;

  const [width, depth] = floorMesh.size;      // 바닥 가로 폭과 깊이
  const [cx, cy, cz] = floorMesh.center;      // 바닥 중심 3D 좌표
  const materialType = floorMesh.material || 'wood'; // 바닥 재질 (기본값: 원목 마루)
  const isSelected = selectedObject === 'floorMesh'; // 사용자가 바닥을 클릭해 선택했는지 여부

  // 원목 마루일 때 표현할 널판(장마루) 줄눈 개수 (가로 1m당 약 2.2개)
  const plankCount = Math.max(4, Math.round(width * 2.2));

  // 온돌 장판일 때 표현할 한지 격자 개수
  const ondolTilesX = Math.max(3, Math.round(width * 1.5));
  const ondolTilesZ = Math.max(3, Math.round(depth * 1.5));

  // 3D 뷰에서 바닥 클릭 시 속성 편집 패널 활성화
  const handleClick = (e: any) => {
    e.stopPropagation();
    selectObject('floorMesh');
  };

  return (
    <group position={[cx, cy, cz]}>
      {/* ----------------------------------------------------------------- */}
      {/* 1. 바닥 메인 3D 메쉬 (클릭 인터랙션 및 재질 셰이더 적용) */}
      {/* ----------------------------------------------------------------- */}
      <mesh
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer'; // 마우스 올렸을 때 클릭 포인터 커서로 변경
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[width, FLOOR_THICKNESS, depth]} />

        {/* 1) 원목 우물마루 재질 (따뜻한 소나무/참나무 원목 톤) */}
        {materialType === 'wood' && (
          <meshStandardMaterial
            color="#68472b"
            roughness={0.65}
            metalness={0.06}
          />
        )}
        {/* 2) 온돌방 콩기름 장판 재질 (윤기 있는 황토빛 전통 장판지) */}
        {materialType === 'ondol' && (
          <meshStandardMaterial
            color="#d49e48"
            roughness={0.4}
            metalness={0.12}
          />
        )}
        {/* 3) 다진 황토 마당 흙바닥 재질 (거칠고 매트한 흙 질감) */}
        {materialType === 'earth' && (
          <meshStandardMaterial
            color="#7a5538"
            roughness={0.95}
            metalness={0.01}
          />
        )}
      </mesh>

      {/* 바닥 선택 시 표시되는 황토빛 와이어프레임 하이라이트 박스 */}
      {isSelected && (
        <mesh position={[0, 0.002, 0]}>
          <boxGeometry args={[width * 1.01, FLOOR_THICKNESS * 1.05, depth * 1.01]} />
          <meshBasicMaterial color="#C56A3D" wireframe transparent opacity={0.8} />
        </mesh>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. 바닥 재질별 상세 시각 오버레이 (줄눈선, 장판지 격자, 흙 알갱이) */}
      {/* ----------------------------------------------------------------- */}
      {/* 1) 우물마루/장마루 널판 줄눈 (목재 틈새 표현) */}
      {materialType === 'wood' && (
        <>
          {Array.from({ length: plankCount - 1 }).map((_, i) => {
            const stepX = width / plankCount;
            const lineX = -width / 2 + (i + 1) * stepX;
            return (
              <mesh
                key={`wood_${i}`}
                position={[lineX, FLOOR_THICKNESS / 2 + 0.001, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                raycast={() => null} // 마우스 클릭 방해 방지
              >
                <planeGeometry args={[0.02, depth - 0.04]} />
                <meshBasicMaterial color="#3b2314" />
              </mesh>
            );
          })}
        </>
      )}

      {/* 2) 온돌 콩기름 한지 장판지 이음매 격자선 */}
      {materialType === 'ondol' && (
        <>
          {/* 가로 방향 격자선 */}
          {Array.from({ length: ondolTilesX - 1 }).map((_, i) => {
            const stepX = width / ondolTilesX;
            const lineX = -width / 2 + (i + 1) * stepX;
            return (
              <mesh
                key={`ondol_x_${i}`}
                position={[lineX, FLOOR_THICKNESS / 2 + 0.001, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                raycast={() => null}
              >
                <planeGeometry args={[0.015, depth - 0.02]} />
                <meshBasicMaterial color="#9e6e28" opacity={0.6} transparent />
              </mesh>
            );
          })}
          {/* 세로 방향 격자선 */}
          {Array.from({ length: ondolTilesZ - 1 }).map((_, j) => {
            const stepZ = depth / ondolTilesZ;
            const lineZ = -depth / 2 + (j + 1) * stepZ;
            return (
              <mesh
                key={`ondol_z_${j}`}
                position={[0, FLOOR_THICKNESS / 2 + 0.001, lineZ]}
                rotation={[-Math.PI / 2, 0, Math.PI / 2]}
                raycast={() => null}
              >
                <planeGeometry args={[0.015, width - 0.02]} />
                <meshBasicMaterial color="#9e6e28" opacity={0.6} transparent />
              </mesh>
            );
          })}
        </>
      )}

      {/* 3) 다진 흙바닥의 미세한 황토 질감 오버레이 */}
      {materialType === 'earth' && (
        <>
          <mesh
            position={[0, FLOOR_THICKNESS / 2 + 0.001, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            raycast={() => null}
          >
            <planeGeometry args={[width * 0.98, depth * 0.98]} />
            <meshStandardMaterial
              color="#68462d"
              roughness={1.0}
              transparent
              opacity={0.35}
              wireframe
            />
          </mesh>
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 3. 마루 외곽 원목 몰딩 테두리 (귀마구리 / 마루 마감턱) */}
      {/* ----------------------------------------------------------------- */}
      {/* 북측 모서리 테두리 */}
      <mesh position={[0, 0.01, -depth / 2 + 0.03]} raycast={() => null}>
        <boxGeometry args={[width, FLOOR_THICKNESS + 0.02, 0.06]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.7} />
      </mesh>
      {/* 남측 모서리 테두리 */}
      <mesh position={[0, 0.01, depth / 2 - 0.03]} raycast={() => null}>
        <boxGeometry args={[width, FLOOR_THICKNESS + 0.02, 0.06]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.7} />
      </mesh>
      {/* 서측 모서리 테두리 */}
      <mesh position={[-width / 2 + 0.03, 0.01, 0]} raycast={() => null}>
        <boxGeometry args={[0.06, FLOOR_THICKNESS + 0.02, depth]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.7} />
      </mesh>
      {/* 동측 모서리 테두리 */}
      <mesh position={[width / 2 - 0.03, 0.01, 0]} raycast={() => null}>
        <boxGeometry args={[0.06, FLOOR_THICKNESS + 0.02, depth]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.7} />
      </mesh>
    </group>
  );
};
