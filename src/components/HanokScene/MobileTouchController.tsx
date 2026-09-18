import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useBuildStore } from '../../store';

interface MobileTouchControllerProps {
  controlsRef: React.RefObject<any>;
}

/**
 * [모바일 3D 터치 인터랙션 컨트롤러 (MobileTouchController)]
 * -----------------------------------------------------------------------------
 * 모바일 및 터치스크린 기기에서 발생하는 제스처를 감지하고, 상태에 따라
 * 카메라 제어와 오브젝트 조작이 충돌하지 않도록 모드를 분리하여 정밀 제어합니다.
 *
 * 제스처 정의:
 * 1. 손가락 1개 드래그 (Single Finger Drag):
 *    - 오브젝트 미선택 시 (`selectedObject === null`):
 *      -> 카메라 360도 궤도 회전 (`interactionMode = 'camera'`)
 *    - 오브젝트 선택 시 (`selectedObject !== null`):
 *      -> 3D 바닥 평면 상에서 오브젝트 이동 (`interactionMode = 'object_drag'`)
 *      -> OrbitControls를 일시 비활성화하여 카메라 회전과 충돌 방지
 * 2. 손가락 2개 핀치 (Two-Finger Pinch):
 *    - 두 손가락 사이의 유클리드 거리 변화를 계산하여 카메라 줌 인/아웃 (`interactionMode = 'pinch_zoom'`)
 * 3. 손가락 2개 드래그 (Two-Finger Pan):
 *    - 두 손가락 중심점의 이동 델타를 계산하여 카메라 및 주시점(target) 평행 이동 (`interactionMode = 'pan'`)
 * 4. 짧은 탭 (Short Tap, < 300ms, < 10px 이동):
 *    - 3D 레이캐스팅으로 터치된 부품 선택 (`selectObject`) 또는 빈 공간 탭 시 선택 해제
 * 5. 롱 프레스 (Long Press, >= 500ms 유지):
 *    - 햅틱 진동 피드백과 함께 부품 상세 정보 모달 오픈 (`openDetailModal`)
 */
export const MobileTouchController: React.FC<MobileTouchControllerProps> = ({ controlsRef }) => {
  const { camera, gl, scene } = useThree();

  // 스토어 상태 및 액션
  const selectedObject = useBuildStore((state) => state.selectedObject);
  const selectObject = useBuildStore((state) => state.selectObject);
  const updatePartPosition = useBuildStore((state) => state.updatePartPosition);
  const setInteractionMode = useBuildStore((state) => state.setInteractionMode);
  const openDetailModal = useBuildStore((state) => state.openDetailModal);
  const placedParts = useBuildStore((state) => state.placedParts);

  // 최신 상태를 이벤트 리스너 내부에서 참조하기 위한 Refs
  const selectedObjectRef = useRef(selectedObject);
  selectedObjectRef.current = selectedObject;

  const placedPartsRef = useRef(placedParts);
  placedPartsRef.current = placedParts;

  // 터치 추적 변수 Refs
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<any>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  // 2손가락 핀치 및 팬 추적용
  const initialPinchDistRef = useRef<number>(0);
  const lastPinchDistRef = useRef<number>(0);
  const lastPanPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 오브젝트 드래그용 가상 수학 평면 (Y축 기준 평면)
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const planeIntersectPoint = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    const canvasDom = gl.domElement;
    if (!canvasDom) return;

    // 터치 좌표를 정규화(-1 ~ +1)된 3D 스크린 좌표로 변환하는 헬퍼 함수
    const getNormalizedCoords = (touch: Touch): THREE.Vector2 => {
      const rect = canvasDom.getBoundingClientRect();
      return new THREE.Vector2(
        ((touch.clientX - rect.left) / rect.width) * 2 - 1,
        -((touch.clientY - rect.top) / rect.height) * 2 + 1
      );
    };

    // 터치 지점 아래의 한옥 부재(오브젝트)를 레이캐스트로 탐색
    const raycastPartAtTouch = (touch: Touch) => {
      const coords = getNormalizedCoords(touch);
      raycaster.current.setFromCamera(coords, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);

      // 1. 객체 트리 상에서 이름이나 userData로 검색
      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== scene) {
          const matchedPart = placedPartsRef.current.find(
            (p) => p.id === cur?.name || p.id === cur?.userData?.partId || (cur?.name && cur.name.includes(p.id))
          );
          if (matchedPart) {
            return matchedPart;
          }
          cur = cur.parent;
        }

        // 2. 만약 그룹에 name이 없더라도 교차된 3D 좌표(hit.point)와 가장 가까운 placedPart 탐색
        let closestPart: any = null;
        let minDistance = 1.6; // 1.6m 반경 내 부재 탐색
        for (const p of placedPartsRef.current) {
          const dx = p.position[0] - hit.point.x;
          const dy = p.position[1] - hit.point.y;
          const dz = p.position[2] - hit.point.z;
          const dist = Math.hypot(dx, dy, dz);
          if (dist < minDistance) {
            minDistance = dist;
            closestPart = p;
          }
        }
        if (closestPart) {
          return closestPart;
        }
      }

      // 3. 지면 레이캐스트 교차점 기준 가장 가까운 부재 탐색
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const groundPoint = new THREE.Vector3();
      if (raycaster.current.ray.intersectPlane(groundPlane, groundPoint)) {
        let closestPart: any = null;
        let minDistance = 1.4;
        for (const p of placedPartsRef.current) {
          const dx = p.position[0] - groundPoint.x;
          const dz = p.position[2] - groundPoint.z;
          const dist = Math.hypot(dx, dz);
          if (dist < minDistance) {
            minDistance = dist;
            closestPart = p;
          }
        }
        if (closestPart) {
          return closestPart;
        }
      }

      return null;
    };

    // -------------------------------------------------------------------------
    // 1. TOUCH START: 터치 시작 시 손가락 개수 파악 및 롱 프레스 타이머 시동
    // -------------------------------------------------------------------------
    const handleTouchStart = (e: TouchEvent) => {
      const touches = e.touches;
      isLongPressTriggeredRef.current = false;

      if (touches.length === 1) {
        const touch = touches[0];
        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
        touchStartTimeRef.current = Date.now();

        // 선택된 오브젝트가 있는 경우 -> 1손가락 이동 모드 준비
        if (selectedObjectRef.current) {
          setInteractionMode('object_drag');
          if (controlsRef.current) {
            controlsRef.current.enabled = false; // OrbitControls 카메라 회전 잠금
          }

          // 선택된 부재의 현재 Y 높이로 드래그 평면 기준선 맞춤
          const activePart = placedPartsRef.current.find((p) => p.id === selectedObjectRef.current);
          const planeY = activePart ? activePart.position[1] : 0;
          dragPlane.current.set(new THREE.Vector3(0, 1, 0), -planeY);
        } else {
          setInteractionMode('camera');
          if (controlsRef.current) {
            controlsRef.current.enabled = true; // OrbitControls 카메라 회전 허용
          }
        }

        // 롱 프레스(Long Press, 500ms) 타이머 시작
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
          isLongPressTriggeredRef.current = true;
          // 터치된 지점의 부품 확인
          const hitPart = raycastPartAtTouch(touch);
          const targetId = hitPart ? hitPart.id : selectedObjectRef.current;

          if (targetId) {
            // 모바일 햅틱 진동 피드백 (지원 브라우저)
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try {
                navigator.vibrate(40);
              } catch (_) {}
            }
            openDetailModal(targetId);
          }
        }, 500);

      } else if (touches.length === 2) {
        // 손가락이 2개 닿으면 롱 프레스 취소 및 핀치/팬 모드 진입
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

        const t1 = touches[0];
        const t2 = touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialPinchDistRef.current = dist;
        lastPinchDistRef.current = dist;

        lastPanPosRef.current = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        setInteractionMode('pinch_zoom');
      }
    };

    // -------------------------------------------------------------------------
    // 2. TOUCH MOVE: 드래그/핀치/팬 연속 인터랙션 처리
    // -------------------------------------------------------------------------
    const handleTouchMove = (e: TouchEvent) => {
      const touches = e.touches;

      if (touches.length === 1) {
        const touch = touches[0];
        const moveDist = Math.hypot(
          touch.clientX - touchStartPosRef.current.x,
          touch.clientY - touchStartPosRef.current.y
        );

        // 손가락이 10px 이상 움직이면 롱 프레스 의도가 아니므로 타이머 취소
        if (moveDist > 10 && longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        // [A] 오브젝트가 선택된 상태에서의 1손가락 드래그 (3D 공간 내 부품 이동)
        if (selectedObjectRef.current) {
          setInteractionMode('object_drag');
          if (controlsRef.current) {
            controlsRef.current.enabled = false;
          }

          // 화면 좌표로부터 3D 레이캐스터 생성 후 가상 평면과의 교차점 연산
          const coords = getNormalizedCoords(touch);
          raycaster.current.setFromCamera(coords, camera);

          if (raycaster.current.ray.intersectPlane(dragPlane.current, planeIntersectPoint.current)) {
            const currentPart = placedPartsRef.current.find((p) => p.id === selectedObjectRef.current);
            if (currentPart) {
              // 0.5m 단위 그리드 스냅 (Grid Snapping)을 적용하여 정갈한 전통 결구선 유지
              const snappedX = Math.round(planeIntersectPoint.current.x * 2) / 2;
              const snappedZ = Math.round(planeIntersectPoint.current.z * 2) / 2;

              // 기존 Y 높이는 유지한 채 수평 좌표 업데이트
              updatePartPosition(currentPart.id, [snappedX, currentPart.position[1], snappedZ]);
            }
          }
        } else {
          // [B] 오브젝트가 선택되지 않은 상태: 카메라 360도 궤도 회전 모드
          setInteractionMode('camera');
        }

      } else if (touches.length === 2) {
        // 손가락 2개 조작: 핀치(Pinch Zoom) 및 드래그(Pan) 감지
        const t1 = touches[0];
        const t2 = touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const currentMidX = (t1.clientX + t2.clientX) / 2;
        const currentMidY = (t1.clientY + t2.clientY) / 2;

        const distDelta = currentDist - lastPinchDistRef.current;
        const panDeltaX = currentMidX - lastPanPosRef.current.x;
        const panDeltaY = currentMidY - lastPanPosRef.current.y;

        // 두 손가락 거리 변화 비율이 크면 Pinch Zoom 우선 처리
        if (Math.abs(distDelta) > Math.hypot(panDeltaX, panDeltaY) * 0.8) {
          setInteractionMode('pinch_zoom');
          if (controlsRef.current) {
            // OrbitControls dollyIn / dollyOut 활용한 부드러운 줌
            const zoomScale = Math.pow(0.98, distDelta * 0.05);
            if (controlsRef.current.dollyIn && controlsRef.current.dollyOut) {
              if (zoomScale > 1) {
                controlsRef.current.dollyOut(zoomScale);
              } else {
                controlsRef.current.dollyIn(1 / zoomScale);
              }
              controlsRef.current.update();
            }
          }
        } else {
          // 두 손가락 동시 이동량이 크면 Pan (수평 카메라 평행 이동) 처리
          setInteractionMode('pan');
          if (controlsRef.current) {
            // 카메라 시선 벡터에 맞춘 직교 평면 Pan 계산
            const panSpeed = 0.015;
            const factor = camera.position.length() * panSpeed * 0.08;

            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

            const panOffset = new THREE.Vector3()
              .addScaledVector(right, -panDeltaX * factor)
              .addScaledVector(up, panDeltaY * factor);

            camera.position.add(panOffset);
            if (controlsRef.current.target) {
              controlsRef.current.target.add(panOffset);
            }
            controlsRef.current.update();
          }
        }

        lastPinchDistRef.current = currentDist;
        lastPanPosRef.current = { x: currentMidX, y: currentMidY };
      }
    };

    // -------------------------------------------------------------------------
    // 3. TOUCH END: 탭(Tap) 선택 판별 및 상호작용 모드 복원
    // -------------------------------------------------------------------------
    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // 롱 프레스가 실행되지 않았고, 터치 유지 시간이 300ms 이내인 경우 -> 짧은 탭(Tap)
      const duration = Date.now() - touchStartTimeRef.current;
      if (!isLongPressTriggeredRef.current && duration < 300 && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const moveDist = Math.hypot(
          touch.clientX - touchStartPosRef.current.x,
          touch.clientY - touchStartPosRef.current.y
        );

        if (moveDist < 12) {
          // 짧은 탭으로 판명: 터치한 위치의 3D 부품 선택
          const hitPart = raycastPartAtTouch(touch);
          if (hitPart) {
            selectObject(hitPart.id);
          } else {
            // 빈 공간 탭 시 선택 해제
            selectObject(null);
          }
        }
      }

      // 터치가 끝나면 인터랙션 모드를 기본 카메라 모드로 복원하고 컨트롤 재활성화
      if (e.touches.length === 0) {
        setInteractionMode('camera');
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      }
    };

    // 캔버스 DOM에 터치 이벤트 바인딩 (passive: false로 기본 스크롤 간섭 방지)
    canvasDom.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvasDom.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvasDom.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvasDom.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      canvasDom.removeEventListener('touchstart', handleTouchStart);
      canvasDom.removeEventListener('touchmove', handleTouchMove);
      canvasDom.removeEventListener('touchend', handleTouchEnd);
      canvasDom.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [camera, gl, scene, controlsRef, selectObject, updatePartPosition, setInteractionMode, openDetailModal]);

  return null;
};
