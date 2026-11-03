import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * High-performance Geometry Batcher.
 * Combines hundreds of individual static meshes sharing the same material
 * into single unified meshes, reducing WebGL draw calls by >90%.
 */
export class GeometryBatcher {
  private batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  private materials = new Map<string, THREE.Material>();

  private canonicalMaterial(material: THREE.Material): THREE.Material {
    if (material.transparent || !['MeshStandardMaterial', 'MeshBasicMaterial'].includes(material.type)) return material;
    const value = material as THREE.MeshStandardMaterial;
    const key = [material.type, value.color?.getHex(), value.emissive?.getHex(), value.emissiveIntensity,
      value.roughness, value.metalness, material.opacity, material.side, material.depthWrite,
      material.depthTest, material.alphaTest, material.blending, material.polygonOffset,
      material.polygonOffsetFactor, material.polygonOffsetUnits, material.toneMapped,
      value.vertexColors, value.flatShading, value.wireframe, value.map?.uuid, value.normalMap?.uuid,
      value.roughnessMap?.uuid, value.metalnessMap?.uuid, value.emissiveMap?.uuid,
      value.aoMap?.uuid, value.alphaMap?.uuid, value.envMap?.uuid].join('|');
    const existing = this.materials.get(key);
    if (existing) return existing;
    this.materials.set(key, material);
    return material;
  }

  public addGeometry(geo: THREE.BufferGeometry, material: THREE.Material, matrix?: THREE.Matrix4) {
    material = this.canonicalMaterial(material);
    const cloned = geo.clone();
    if (matrix) {
      cloned.applyMatrix4(matrix);
    }
    if (!cloned.attributes.normal) {
      cloned.computeVertexNormals();
    }
    if (!cloned.attributes.uv && cloned.attributes.position) {
      const count = cloned.attributes.position.count;
      cloned.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    if (cloned.attributes.uv2) {
      cloned.deleteAttribute('uv2');
    }
    let list = this.batches.get(material);
    if (!list) {
      list = [];
      this.batches.set(material, list);
    }
    list.push(cloned);
  }

  public addBox(
    size: [number, number, number],
    pos: [number, number, number],
    material: THREE.Material,
    rot?: [number, number, number]
  ) {
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const matrix = new THREE.Matrix4();
    const translation = new THREE.Matrix4().makeTranslation(pos[0], pos[1], pos[2]);
    if (rot) {
      const euler = new THREE.Euler(rot[0], rot[1], rot[2]);
      const rotation = new THREE.Matrix4().makeRotationFromEuler(euler);
      matrix.multiply(translation).multiply(rotation);
    } else {
      matrix.copy(translation);
    }
    this.addGeometry(geo, material, matrix);
    geo.dispose();
  }

  public addCylinder(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    radialSegments: number,
    pos: [number, number, number],
    material: THREE.Material,
    rot?: [number, number, number]
  ) {
    const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    const matrix = new THREE.Matrix4();
    const translation = new THREE.Matrix4().makeTranslation(pos[0], pos[1], pos[2]);
    if (rot) {
      const euler = new THREE.Euler(rot[0], rot[1], rot[2]);
      const rotation = new THREE.Matrix4().makeRotationFromEuler(euler);
      matrix.multiply(translation).multiply(rotation);
    } else {
      matrix.copy(translation);
    }
    this.addGeometry(geo, material, matrix);
    geo.dispose();
  }

  public buildMeshes(parentGroup: THREE.Group, options?: { castShadow?: boolean; receiveShadow?: boolean }) {
    for (const [material, geometries] of this.batches.entries()) {
      if (geometries.length === 0) continue;
      try {
        const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
        if (merged) {
          const mesh = new THREE.Mesh(merged, material);
          if (options?.castShadow !== undefined) mesh.castShadow = options.castShadow;
          if (options?.receiveShadow !== undefined) mesh.receiveShadow = options.receiveShadow;
          parentGroup.add(mesh);
        }
      } catch (err) {
        console.warn('Batch merge fallback:', err);
        geometries.forEach(g => {
          const m = new THREE.Mesh(g, material);
          if (options?.castShadow !== undefined) m.castShadow = options.castShadow;
          if (options?.receiveShadow !== undefined) m.receiveShadow = options.receiveShadow;
          parentGroup.add(m);
        });
      }
      geometries.forEach(g => g.dispose());
    }
    this.batches.clear();
    this.materials.clear();
  }

  /**
   * Automatically batches all static Meshes within a group hierarchy by material.
   * Eliminates hundreds of draw calls while preserving positions, rotations, scales and shadows.
   */
  public static batchStaticGroup(
    rootGroup: THREE.Group,
    excludeFilter?: (mesh: THREE.Mesh) => boolean
  ) {
    const batcher = new GeometryBatcher();
    const toRemove: THREE.Mesh[] = [];

    rootGroup.updateMatrixWorld(true);
    const invRoot = new THREE.Matrix4().copy(rootGroup.matrixWorld).invert();

    rootGroup.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.userData?.isDynamic || (excludeFilter && excludeFilter(child))) {
          return;
        }
        if (!(child.geometry instanceof THREE.BufferGeometry)) {
          return;
        }
        const mat = child.material;
        if (!mat || Array.isArray(mat)) {
          return;
        }

        const localMat = new THREE.Matrix4().multiplyMatrices(invRoot, child.matrixWorld);
        batcher.addGeometry(child.geometry, mat, localMat);
        toRemove.push(child);
      }
    });

    toRemove.forEach(m => {
      if (m.parent) {
        m.parent.remove(m);
      }
    });

    batcher.buildMeshes(rootGroup, { castShadow: true, receiveShadow: true });
  }

  /** Merge decorations within each animated body part, preserving every joint and prop group. */
  public static batchAnimatedParts(root: THREE.Group) {
    const parts: THREE.Group[] = [];
    root.traverse(object => { if (object instanceof THREE.Group) parts.push(object); });
    for (const part of parts) {
      const meshes = part.children.filter((object): object is THREE.Mesh =>
        object instanceof THREE.Mesh && object.children.length === 0 &&
        !Array.isArray(object.material) && !object.material.transparent &&
        !object.userData.isDynamic
      );
      if (meshes.length < 2) continue;
      const batcher = new GeometryBatcher();
      for (const mesh of meshes) {
        mesh.updateMatrix();
        batcher.addGeometry(mesh.geometry, mesh.material as THREE.Material, mesh.matrix);
        part.remove(mesh);
      }
      batcher.buildMeshes(part, { castShadow: true, receiveShadow: true });
    }
  }
}
