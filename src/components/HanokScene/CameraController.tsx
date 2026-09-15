import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCameraStore, CAMERA_OFFSET_CONFIGS, CAMERA_PRESET_CONFIGS } from '../../store';
import { useBuildStore } from '../../store/useBuildStore';
import { useRoofStore } from '../../store/useRoofStore';

interface CameraControllerProps {
  controlsRef: React.RefObject<any>;
}

/**
 * [CameraController]
 * 한옥 씬의 카메라 위치와 회전축(Target)을 제어하는 컴포넌트입니다.
 * 
 * 주요 역할:
 * 1. 현재 배치된 부재들(placedParts: 주춧돌, 기둥, 보, 벽 등)의 3D 바운딩 박스를 계산하여
 *    "건물의 정중앙 좌표 [centerX, centerY, centerZ]"를 실시간으로 도출합니다.
 * 2. 하단 툴바에서 시점(TOP, FRONT, ISOMETRIC, DEFAULT 등) 버튼을 클릭했을 때,
 *    건물 정중앙을 타깃으로 삼고 카메라를 목표 위치까지 부드럽게(lerp) 이동시킵니다.
 * 3. 이동 완료 후 OrbitControls의 회전축(target)도 건물의 중심에 고정하여,
 *    마우스로 회전하더라도 건물이 화면 정중앙에서 벗어나지 않고 제자리에서 회전하도록 합니다.
 */
export const CameraController: React.FC<CameraControllerProps> = ({ controlsRef }) => {
  const currentPreset = useCameraStore((state) => state.currentPreset);
  const placedParts = useBuildStore((state) => state.placedParts);
  const hasRoof = useRoofStore((state) => state.hasRoof);

  // 현재 애니메이션 목표가 되는 카메라 위치, 주시 지점(Target), 화각(FOV)
  const targetPos = useRef(new THREE.Vector3(...CAMERA_PRESET_CONFIGS.default.position));
  const targetLook = useRef(new THREE.Vector3(...CAMERA_PRESET_CONFIGS.default.target));
  const targetFov = useRef<number>(CAMERA_PRESET_CONFIGS.default.fov);
  const isTransitioning = useRef<boolean>(false);
  const { size, camera } = useThree();

  // ---------------------------------------------------------------------------
  // [1] 배치된 한옥 모델의 3차원 바운딩 박스 중심(Center) 동적 계산
  // ---------------------------------------------------------------------------
  const buildingCenter = useMemo((): [number, number, number] => {
    if (placedParts.length === 0) {
      // 배치된 부재가 전혀 없을 때는 그리드 중심의 기본 시선 높이(Y=1.6m) 반환
      return [0, 1.6, 0];
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    placedParts.forEach((part) => {
      const [px, py, pz] = part.position;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      if (pz < minZ) minZ = pz;
      if (pz > maxZ) maxZ = pz;
    });

    // 지붕(서까래/기와)이 올라가 있으면 상단 높이를 지붕 꼭대기(용마루 약 4.2~4.5m)까지 확장
    if (hasRoof) {
      maxY = Math.max(maxY, 4.3);
    } else {
      // 기둥(높이 2.8m) 머리 높이까지 반영
      maxY = Math.max(maxY, 3.2);
    }
    // 주춧돌 바닥 최저 높이 보정
    minY = Math.min(minY, 0.0);

    const centerX = (minX + maxX) / 2;
    // 건물의 수직 중심(건물 높이의 정중앙)
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    return [centerX, centerY, centerZ];
  }, [placedParts, hasRoof]);

  // 뷰포트 크기가 변경될 때 카메라 종횡비(Aspect Ratio) 자동 갱신
  React.useEffect(() => {
    if ('aspect' in camera && typeof (camera as THREE.PerspectiveCamera).aspect === 'number') {
      const pCam = camera as THREE.PerspectiveCamera;
      pCam.aspect = size.width / size.height;
      pCam.updateProjectionMatrix();
    }
  }, [size, camera]);

  // ---------------------------------------------------------------------------
  // [2] 시점(Preset) 버튼 클릭 시에만 목표 좌표 설정 및 애니메이션 활성화
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    const offsetConfig = CAMERA_OFFSET_CONFIGS[currentPreset] || CAMERA_OFFSET_CONFIGS.default;
    const [cx, cy, cz] = buildingCenter;

    // 타깃 지점: 건물의 정중앙
    const lookY = offsetConfig.fixedTargetY !== undefined ? offsetConfig.fixedTargetY : cy;
    targetLook.current.set(cx, lookY, cz);

    // 카메라 위치: 건물 중심 + 프리셋별 상대 오프셋 벡터
    const [ox, oy, oz] = offsetConfig.offset;
    targetPos.current.set(cx + ox, cy + oy, cz + oz);

    // 화각 설정
    targetFov.current = offsetConfig.fov;

    // 프리셋 버튼을 눌렀을 때만 부드러운 전환 애니메이션 시작
    isTransitioning.current = true;
  }, [currentPreset]);

  // ---------------------------------------------------------------------------
  // [3] 마우스 드래그(OrbitControls 조작) 감지:
  // 사용자가 화면을 클릭하거나 드래그하는 순간 중앙정렬 보간을 즉시 해제하여
  // 사용자가 원하는 각도로 완전히 자유롭게 돌아가도록 설정
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // OrbitControls 조작 시작('start' 이벤트: 마우스 좌클릭/우클릭 드래그 시 발생)
    const handleControlStart = () => {
      // 카메라 강제 정렬 애니메이션 즉시 중단 -> 자유로운 마우스 회전 보장
      isTransitioning.current = false;
    };

    controls.addEventListener('start', handleControlStart);
    return () => {
      controls.removeEventListener('start', handleControlStart);
    };
  }, [controlsRef]);

  // ---------------------------------------------------------------------------
  // [4] 프레임 단위 보간 애니메이션 ( 시점 버튼 클릭 시에만 부드럽게 감속 수렴 )
  // ---------------------------------------------------------------------------
  useFrame((state) => {
    // 사용자가 마우스로 드래그 중이거나 전환이 끝난 상태면 아무런 간섭도 하지 않음
    if (!isTransitioning.current) return;

    // 1. 카메라 위치를 목표 위치로 8%씩 부드럽게 접근 (lerp)
    state.camera.position.lerp(targetPos.current, 0.08);

    // 2. OrbitControls의 target(바라보는 중심점)을 건물 중심으로 부드럽게 이동
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, 0.08);
      controlsRef.current.update();
    } else {
      state.camera.lookAt(targetLook.current);
    }

    // 3. 렌즈 화각(FOV) 부드럽게 조정
    if ('fov' in state.camera && typeof (state.camera as THREE.PerspectiveCamera).fov === 'number') {
      const pCam = state.camera as THREE.PerspectiveCamera;
      pCam.fov = THREE.MathUtils.lerp(pCam.fov, targetFov.current, 0.08);
      pCam.updateProjectionMatrix();
    }

    // 4. 목표 지점에 충분히 근접(오차 3cm 미만)하면 애니메이션을 완전히 종료하여 자유 조작 보장
    const posDist = state.camera.position.distanceTo(targetPos.current);
    const lookDist = controlsRef.current
      ? controlsRef.current.target.distanceTo(targetLook.current)
      : 0;

    if (posDist < 0.03 && lookDist < 0.03) {
      state.camera.position.copy(targetPos.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLook.current);
        controlsRef.current.update();
      }
      isTransitioning.current = false;
    }
  });

  return null;
};
