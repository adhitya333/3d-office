import * as THREE from 'three';

interface RoomSign {
  title: string;
  subtitle: string;
  position: [number, number, number];
  rotationY: number;
}

/** Quiet, readable wall signage. The canteen has its own menu panel. */
export class HighResBoards {
  public static create(): { group: THREE.Group } {
    const group = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x080A0D, metalness: 0.28, roughness: 0.45 });
    const signs: RoomSign[] = [
      { title: 'WEB & SEARCH', subtitle: 'Design · Build · Refine', position: [-9.5, 2, -10.35], rotationY: 0 },
      { title: 'AI & SYSTEMS', subtitle: 'Research · Integrate · Ship', position: [-9.5, 2, 10.35], rotationY: Math.PI },
      { title: 'BRAND & DESIGN', subtitle: 'Ideas into outcomes', position: [9.5, 2, 10.35], rotationY: Math.PI },
      { title: 'EXECUTIVE OFFICE', subtitle: 'Direction · Decisions · Delivery', position: [2.67, 2, -8.6], rotationY: Math.PI / 2 },
    ];

    signs.forEach(sign => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#08090B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#F3F0E9';
      ctx.font = '600 76px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sign.title, 512, 230, 890);
      ctx.fillStyle = '#AAA9A5';
      ctx.font = '400 34px Inter, Arial, sans-serif';
      ctx.fillText(sign.subtitle, 512, 310, 890);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 4;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 0.06), frameMaterial);
      frame.position.set(...sign.position);
      frame.rotation.y = sign.rotationY;
      group.add(frame);

      const facing = new THREE.Vector3(Math.sin(sign.rotationY), 0, Math.cos(sign.rotationY));
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 1.7),
        new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
      );
      face.position.set(
        sign.position[0] + facing.x * 0.033,
        sign.position[1],
        sign.position[2] + facing.z * 0.033
      );
      face.rotation.y = sign.rotationY;
      group.add(face);
    });

    return { group };
  }
}
