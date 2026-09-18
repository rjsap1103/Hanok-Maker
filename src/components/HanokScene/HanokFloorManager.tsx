import React from 'react';
import { useBuildStore, type FloorCellData } from '../../store';

// 마루(바닥) 원목 데크의 두께 (8cm)
const FLOOR_THICKNESS = 0.08;

/**
 * [한옥 바닥 관리 매니저 (HanokFloorManager)]
 * -------------------------------------------------------------
 * 1. 배치된 주춧돌들의 실제 구역(베이)을 감지하여 마루(바닥)를 자동으로 생성합니다.
 *    - 직사각형뿐 아니라 'ㄱ'자, 'ㄷ'자, 'T'자형 배치에서도 주춧돌이 놓인 구역에만 바닥이 형성됩니다.
 * 2. 3가지 전통 바닥 재질을 지원합니다:
 *    - wood: 대청마루 / 우물마루 (원목 널판 줄눈 표현)
 *    - ondol: 온돌방 콩기름 장판 (전통 한지 장판 격자선 표현)
 *    - earth: 다진 황토 마당 흙바닥
 * 3. 바닥의 어느 곳을 클릭하더라도 우측 하단 ComponentInfo 패널에서 재질을 즉시 교체할 수 있습니다.
 */
export const HanokFloorManager: React.FC = () => {
  // 스토어에서 바닥 메쉬 정보와 현재 선택된 3D 오브젝트 가져오기
  const floorMesh = useBuildStore((state) => state.floorMesh);
  const selectedObject = useBuildStore((state) => state.selectedObject);
  const selectObject = useBuildStore((state) => state.selectObject);

  // 주춧돌이 없거나 바닥이 비활성화 상태면 렌더링하지 않음
  if (!floorMesh || !floorMesh.visible) return null;

  const materialType = floorMesh.material || 'wood'; // 바닥 재질 (기본값: 원목 마루)
  const isSelected = selectedObject === 'floorMesh'; // 사용자가 바닥을 클릭해 선택했는지 여부

  // 3D 뷰에서 바닥 클릭 시 속성 편집 패널 활성화
  const handleClick = (e: any) => {
    e.stopPropagation();
    selectObject('floorMesh');
  };

  // 복수 셀(FloorCellData)이 존재하면 해당 셀들을 렌더링하고, 없으면 전체 bounding box 단일 셀로 폴백
  const cells: FloorCellData[] =
    floorMesh.cells && floorMesh.cells.length > 0
      ? floorMesh.cells
      : [
          {
            x0: floorMesh.center[0] - floorMesh.size[0] / 2,
            x1: floorMesh.center[0] + floorMesh.size[0] / 2,
            z0: floorMesh.center[2] - floorMesh.size[1] / 2,
            z1: floorMesh.center[2] + floorMesh.size[1] / 2,
            center: floorMesh.center,
            size: floorMesh.size,
            edges: { north: true, south: true, west: true, east: true },
          },
        ];

  return (
    <group>
      {cells.map((cell, cellIdx) => {
        const [w, d] = cell.size;
        const [cx, cy, cz] = cell.center;

        // 원목 마루일 때 표현할 널판(장마루) 줄눈 개수 (가로 1m당 약 2.2개)
        const plankCount = Math.max(3, Math.round(w * 2.2));

        // 온돌 장판일 때 표현할 한지 격자 개수
        const ondolTilesX = Math.max(2, Math.round(w * 1.5));
        const ondolTilesZ = Math.max(2, Math.round(d * 1.5));

        return (
          <group key={`floor_cell_${cellIdx}`} position={[cx, cy, cz]}>
            {/* ----------------------------------------------------------------- */}
            {/* 1. 바닥 메인 3D 메쉬 (클릭 인터랙션 및 재질 셰이더 적용) */}
            {/* ----------------------------------------------------------------- */}
            <mesh
              castShadow
              receiveShadow
              onClick={handleClick}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <boxGeometry args={[w, FLOOR_THICKNESS, d]} />

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
                <boxGeometry args={[w * 1.008, FLOOR_THICKNESS * 1.05, d * 1.008]} />
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
                  const stepX = w / plankCount;
                  const lineX = -w / 2 + (i + 1) * stepX;
                  return (
                    <mesh
                      key={`wood_${cellIdx}_${i}`}
                      position={[lineX, FLOOR_THICKNESS / 2 + 0.001, 0]}
                      rotation={[-Math.PI / 2, 0, 0]}
                      raycast={() => null}
                    >
                      <planeGeometry args={[0.02, d - 0.04]} />
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
                  const stepX = w / ondolTilesX;
                  const lineX = -w / 2 + (i + 1) * stepX;
                  return (
                    <mesh
                      key={`ondol_x_${cellIdx}_${i}`}
                      position={[lineX, FLOOR_THICKNESS / 2 + 0.001, 0]}
                      rotation={[-Math.PI / 2, 0, 0]}
                      raycast={() => null}
                    >
                      <planeGeometry args={[0.015, d - 0.02]} />
                      <meshBasicMaterial color="#9e6e28" opacity={0.6} transparent />
                    </mesh>
                  );
                })}
                {/* 세로 방향 격자선 */}
                {Array.from({ length: ondolTilesZ - 1 }).map((_, j) => {
                  const stepZ = d / ondolTilesZ;
                  const lineZ = -d / 2 + (j + 1) * stepZ;
                  return (
                    <mesh
                      key={`ondol_z_${cellIdx}_${j}`}
                      position={[0, FLOOR_THICKNESS / 2 + 0.001, lineZ]}
                      rotation={[-Math.PI / 2, 0, Math.PI / 2]}
                      raycast={() => null}
                    >
                      <planeGeometry args={[0.015, w - 0.02]} />
                      <meshBasicMaterial color="#9e6e28" opacity={0.6} transparent />
                    </mesh>
                  );
                })}
              </>
            )}

            {/* 3) 다진 흙바닥의 미세한 황토 질감 오버레이 */}
            {materialType === 'earth' && (
              <mesh
                position={[0, FLOOR_THICKNESS / 2 + 0.001, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                raycast={() => null}
              >
                <planeGeometry args={[w * 0.98, d * 0.98]} />
                <meshStandardMaterial
                  color="#68462d"
                  roughness={1.0}
                  transparent
                  opacity={0.35}
                  wireframe
                />
              </mesh>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* 3. 마루 외곽 원목 몰딩 테두리 (귀마구리 / 마루 마감턱) */}
            {/* 인접 칸과 맞닿은 안쪽은 테두리를 치지 않고, 외곽 모서리에만 설치 */}
            {/* ----------------------------------------------------------------- */}
            {/* 북측 외곽 테두리 */}
            {cell.edges.north && (
              <mesh position={[0, 0.01, -d / 2 + 0.03]} raycast={() => null}>
                <boxGeometry args={[w, FLOOR_THICKNESS + 0.02, 0.06]} />
                <meshStandardMaterial color="#4a2e1b" roughness={0.7} />
              </mesh>
            )}
            {/* 남측 외곽 테두리 */}
            {cell.edges.south && (
              <mesh position={[0, 0.01, d / 2 - 0.03]} raycast={() => null}>
                <boxGeometry args={[w, FLOOR_THICKNESS + 0.02, 0.06]} />
                <meshStandardMaterial color="#4a2e1b" roughness={0.7} />
              </mesh>
            )}
            {/* 서측 외곽 테두리 */}
            {cell.edges.west && (
              <mesh position={[-w / 2 + 0.03, 0.01, 0]} raycast={() => null}>
                <boxGeometry args={[0.06, FLOOR_THICKNESS + 0.02, d]} />
                <meshStandardMaterial color="#4a2e1b" roughness={0.7} />
              </mesh>
            )}
            {/* 동측 외곽 테두리 */}
            {cell.edges.east && (
              <mesh position={[w / 2 - 0.03, 0.01, 0]} raycast={() => null}>
                <boxGeometry args={[0.06, FLOOR_THICKNESS + 0.02, d]} />
                <meshStandardMaterial color="#4a2e1b" roughness={0.7} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

