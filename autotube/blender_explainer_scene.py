"""Render stylized, animated 3D mechanism scenes with Blender."""
import bpy
import json
import math
import sys
from mathutils import Vector
from pathlib import Path


def material(name, color, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1.0)
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*color, 1.0)
    bs.inputs["Metallic"].default_value = metallic
    bs.inputs["Roughness"].default_value = 0.32
    return m


def finish(obj, mat):
    obj.data.materials.append(mat)
    if obj.type == "MESH":
        bevel = obj.modifiers.new("Soft machined edges", "BEVEL")
        bevel.width = 0.035
        bevel.segments = 2
        obj.modifiers.new("Weighted highlights", "WEIGHTED_NORMAL")
    return obj


def cube(name, loc, scale, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(o, mat)


def cyl(name, loc, radius, depth, mat, axis="Z", vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    if axis == "X":
        o.rotation_euler[1] = math.pi / 2
    if axis == "Y":
        o.rotation_euler[0] = math.pi / 2
    return finish(o, mat)


def sphere(name, loc, radius, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=radius, location=loc)
    return finish(bpy.context.object, mat)


def torus(name, loc, major, minor, mat, axis="Z"):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=40, minor_segments=10, location=loc)
    o = bpy.context.object
    if axis == "X":
        o.rotation_euler[1] = math.pi / 2
    if axis == "Y":
        o.rotation_euler[0] = math.pi / 2
    return finish(o, mat)


def rod(name, a, b, radius, mat):
    mid = tuple((x + y) / 2 for x, y in zip(a, b))
    o = cyl(name, mid, radius, math.dist(a, b), mat)
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = (Vector(b) - Vector(a)).to_track_quat("Z", "Y")
    return o


def track(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()


def gear(name, x, y, radius, mat):
    hub = cyl(name, (x, y, 1.45), radius * 0.76, 0.30, mat)
    teeth = []
    for i in range(10):
        a = math.tau * i / 10
        t = cube(name + " tooth", (x + math.cos(a) * radius, y + math.sin(a) * radius, 1.45), (radius * 0.42, 0.20, 0.32), mat)
        t.rotation_euler[2] = a
        teeth.append((t, a))
    torus(name + " bearing", (x, y, 1.64), radius * 0.40, 0.045, mat)
    return hub, teeth, x, y, radius


def spin_gear(p, assembly, direction):
    hub, teeth, x, y, radius = assembly
    setattr(hub, "rotation_euler", (0, 0, direction * p))
    for tooth, base_angle in teeth:
        a = base_angle + direction * p
        tooth.location = (x + math.cos(a) * radius, y + math.sin(a) * radius, 1.45)
        tooth.rotation_euler[2] = a


def model(kind, M):
    navy, steel, teal, gold, coral, white, glass = (M[k] for k in ("navy", "steel", "teal", "gold", "coral", "white", "glass"))
    anim = []
    if kind == "reactor":
        cube("reactor foundation", (0, 0, 0.55), (3.7, 2.4, 0.35), steel)
        # Open cutaway frame keeps the core and fuel rods visible.
        for x in (-0.94, 0.94):
            for y in (-0.72, 0.72):
                rod("vessel support", (x, y, 0.78), (x, y, 3.35), 0.095, steel)
        for z in (0.9, 3.25):
            torus("vessel flange", (0, 0, z), 1.12, 0.10, gold)
        cyl("reactor core", (0, 0, 2.05), 0.32, 1.75, navy)
        sphere("glowing core", (0, 0, 2.12), 0.44, gold)
        for i in range(8):
            a = math.tau * i / 8
            rod("fuel rod", (math.cos(a) * 0.64, math.sin(a) * 0.64, 1.05), (math.cos(a) * 0.64, math.sin(a) * 0.64, 3.02), 0.05, teal)
        for x in (-1.35, 1.35):
            rod("coolant pipe", (x, 0, 0.95), (x, 0, 3.0), 0.11, teal)
        for i in range(5):
            particle = sphere("rising heat", (0, 0, 1.25), 0.075, gold)
            anim.append(lambda p, o=particle, i=i: setattr(o, "location", (0.34 * math.sin(p + i), 0.22 * math.cos(p + i), 1.05 + ((p / math.tau + i * 0.2) % 1) * 2.0)))
    elif kind == "battery":
        cube("battery body", (0, 0, 1.25), (3.4, 1.9, 2.4), steel)
        for x in (-0.78, 0.78):
            cube("cell", (x, 0, 1.35), (1.2, 1.35, 1.9), navy)
            for z in (0.8, 1.25, 1.7, 2.15):
                cube("cell layer", (x, 0, z), (0.95, 1.42, 0.10), teal if z < 1.5 else gold)
        for x, mat in ((-1.55, coral), (1.55, teal)):
            cube("terminal", (x, 0, 2.62), (0.48, 0.5, 0.25), mat)
        for i in range(4):
            charge = sphere("charge", (-1.25 + i * 0.22, 0, 2.95), 0.08, gold)
            anim.append(lambda p, o=charge, i=i: setattr(o, "location", (-1.25 + ((p / math.tau + i * 0.18) % 1) * 2.5, 0, 2.95)))
    elif kind == "chip":
        cube("silicon package", (0, 0, 1.2), (3.2, 2.6, 0.62), navy)
        cube("silicon die", (0, 0, 1.58), (1.85, 1.55, 0.25), teal)
        for x in (-1.35, -0.9, -0.45, 0, 0.45, 0.9, 1.35):
            for y in (-1.15, 1.15):
                cube("pin", (x, y, 0.96), (0.12, 0.55, 0.12), gold)
        for y in (-0.9, -0.45, 0, 0.45, 0.9):
            for x in (-1.0, 1.0):
                cube("circuit trace", (x, y, 1.73), (0.28, 0.09, 0.05), white)
        for i in range(5):
            pulse = sphere("data pulse", (-0.9, -0.7 + i * 0.35, 1.88), 0.09, gold)
            anim.append(lambda p, o=pulse, i=i: setattr(o, "location", (-0.9 + ((p / math.tau + i * 0.2) % 1) * 1.8, o.location.y, 1.88)))
    elif kind == "orbit":
        sphere("star", (0, 0, 1.5), 0.58, gold)
        for radius, mat in ((1.45, teal), (2.3, steel)):
            torus("orbital path", (0, 0, 1.5), radius, 0.025, mat)
            planet = sphere("planet", (radius, 0, 1.5), 0.22 if radius < 2 else 0.30, teal if radius < 2 else coral)
            anim.append(lambda p, o=planet, r=radius: setattr(o, "location", (r * math.cos(p), r * math.sin(p) * 0.72, 1.5)))
    elif kind in ("elevator", "mechanism"):
        for x in (-1.35, 1.35):
            cyl("lift column", (x, 0, 1.8), 0.09, 3.6, steel)
        cube("lift platform", (0, 0, 1.2), (2.6, 1.75, 0.22), teal)
        cabin = cube("lift cabin", (0, 0, 1.92), (2.0, 1.45, 1.15), glass)
        for x in (-0.76, 0.76):
            torus("pulley", (x, 0, 3.25), 0.36, 0.09, gold, "X")
            cyl("pulley axle", (x, 0, 3.25), 0.10, 0.35, steel, "X")
        anim.append(lambda p, o=cabin: setattr(o, "location", (0, 0, 1.92 + 0.32 * math.sin(p))))
        for i in range(4):
            counterweight = sphere("lift counterweight", (-1.0 + i * 0.65, 0, 3.0), 0.07, gold)
            anim.append(lambda p, o=counterweight, i=i: setattr(o, "location", (-1.0 + i * 0.65, 0, 3.0 - 0.32 * math.sin(p))))
    elif kind in ("engine", "motor"):
        cyl("motor casing", (0, 0, 1.5), 0.9, 2.7, steel, "X")
        for x in (-0.9, -0.45, 0, 0.45, 0.9):
            torus("cooling rib", (x, 0, 1.5), 0.88, 0.055, navy, "X")
        cyl("drive shaft", (1.65, 0, 1.5), 0.20, 1.1, gold, "X")
        rotor = cyl("rotor", (0, 0, 1.5), 0.48, 1.4, teal, "X")
        spokes = []
        for i in range(8):
            a = math.tau * i / 8
            spokes.append(cube("rotor spoke", (0, math.cos(a) * 0.25, 1.5 + math.sin(a) * 0.25), (1.0, 0.10, 0.10), gold))
            spokes[-1].rotation_euler[0] = a
        def update_rotor(p, o=rotor, ss=spokes):
            o.rotation_euler = (p, 0, 0)
            for i, spoke in enumerate(ss):
                a = p + math.tau * i / 8
                spoke.location = (0, math.cos(a) * 0.25, 1.5 + math.sin(a) * 0.25)
                spoke.rotation_euler[0] = a
        anim.append(update_rotor)
        for i in range(8):
            a = math.tau * i / 8
            cube("stator winding", (-0.15, math.cos(a) * 0.68, 1.5 + math.sin(a) * 0.68), (1.8, 0.14, 0.14), coral)
    elif kind in ("solar", "panel"):
        for x in (-1.1, 1.1):
            rod("panel support", (x, 0, 0.25), (x, 0, 1.35), 0.08, steel)
        cube("solar panel", (0, 0, 1.45), (3.1, 2.0, 0.18), navy)
        for x in (-1.0, -0.5, 0, 0.5, 1.0):
            cube("photovoltaic strip", (x, 0, 1.56), (0.035, 1.8, 0.035), teal)
        for y in (-0.5, 0, 0.5):
            cube("cell divider", (0, y, 1.56), (2.95, 0.035, 0.035), teal)
        for i in range(4):
            photon = sphere("photon", (-1.2, -0.3 + i * 0.2, 2.65), 0.07, gold)
            anim.append(lambda p, o=photon, i=i: setattr(o, "location", (1.2 - ((p / math.tau + i * 0.2) % 1) * 2.4, o.location.y, 2.65)))
    elif kind == "fiber":
        # Open cutaway: cladding rails frame the visible glass core.
        for z in (1.18, 2.02):
            rod("fiber cladding rail", (-2.1, -0.30, z), (2.1, -0.30, z), 0.11, steel)
        for y in (-0.68, 0.08):
            rod("fiber jacket rail", (-2.1, y, 1.60), (2.1, y, 1.60), 0.09, navy)
        rod("glass fiber core", (-2.0, -0.30, 1.60), (2.0, -0.30, 1.60), 0.065, teal)
        for x in (-1.85, 1.85):
            torus("fiber connector", (x, -0.30, 1.60), 0.36, 0.055, gold, "X")
        for i in range(4):
            packet = sphere("light pulse", (-1.8, -0.30, 1.60), 0.10, gold)
            anim.append(lambda p, o=packet, i=i: setattr(o, "location", (-1.8 + ((p / math.tau + i * 0.25) % 1) * 3.6, -0.30, 1.60)))
    elif kind == "wave":
        beads = [sphere("wave sample", (-2.1 + i * 0.18, 0, 1.55), 0.07, teal if i % 3 else gold) for i in range(24)]
        for i, bead in enumerate(beads):
            x = -2.1 + i * 0.18
            anim.append(lambda p, o=bead, x=x: setattr(o, "location", (x, 0, 1.55 + 0.62 * math.sin(x * 2.3 - p))))
        rod("wave axis", (-2.2, 0, 1.55), (2.2, 0, 1.55), 0.018, steel)
    elif kind == "screen":
        cube("display housing", (0, 0, 1.6), (3.8, 0.28, 2.5), steel)
        cube("display glass", (0, -0.17, 1.6), (3.45, 0.06, 2.15), navy)
        for row in range(6):
            for col in range(10):
                cube("screen pixel", (-1.45 + col * 0.32, -0.22, 0.82 + row * 0.30), (0.20, 0.025, 0.18), teal if (row + col) % 3 else steel)
        cursor = cube("active pixel", (-1.45, -0.26, 0.82), (0.22, 0.04, 0.20), gold)
        anim.append(lambda p, o=cursor: setattr(o, "location", (-1.45 + (int((p / math.tau) * 60) % 10) * 0.32, -0.26, 0.82 + (int((p / math.tau) * 60) // 10 % 6) * 0.30)))
    elif kind == "sensor":
        cube("sensor board", (0, 0, 1.45), (3.3, 1.7, 0.30), navy)
        cube("image sensor", (0, 0.05, 1.68), (1.8, 0.95, 0.13), teal)
        for row in range(4):
            for col in range(8):
                cube("sensor pixel", (-0.72 + col * 0.205, 0.04, 1.77 + row * 0.20), (0.12, 0.10, 0.12), gold if (row + col) % 4 == 0 else steel)
        cyl("lens barrel", (0, -0.95, 1.7), 0.62, 0.85, steel, "Y")
        torus("lens rim", (0, -1.40, 1.7), 0.47, 0.09, gold, "Y")
        cyl("glass lens", (0, -1.42, 1.7), 0.39, 0.05, glass, "Y")
        for x in (-0.30, 0, 0.30):
            rod("light ray", (x * 1.8, -1.55, 2.55), (x, -0.05, 1.82), 0.025, teal)
        for i in range(3):
            photon = sphere("incoming photon", (-0.3 + i * 0.3, -1.55, 2.55), 0.07, gold)
            anim.append(lambda p, o=photon, i=i: setattr(o, "location", (-0.3 + i * 0.3, -1.5 + ((p / math.tau + i * 0.3) % 1) * 1.2, 2.55 - ((p / math.tau + i * 0.3) % 1) * 0.72)))
    elif kind == "payment":
        cube("payment terminal", (-1.25, 0, 1.30), (1.25, 0.95, 1.75), steel)
        cube("terminal display", (-1.25, -0.49, 1.72), (0.78, 0.05, 0.48), navy)
        for row in range(2):
            for col in range(3):
                sphere("keypad", (-1.52 + col * 0.27, -0.53, 1.13 + row * 0.22), 0.065, gold)
        cube("bank server", (1.4, 0, 1.45), (1.15, 1.1, 2.25), navy)
        for z in (0.62, 1.05, 1.48, 1.91, 2.34):
            cube("bank drawer", (1.4, -0.57, z), (0.87, 0.06, 0.25), steel)
            sphere("bank signal", (1.72, -0.63, z), 0.055, teal)
        rod("secure transaction path", (-0.48, -0.22, 1.75), (0.80, -0.22, 1.75), 0.035, teal)
        for i in range(4):
            packet = sphere("encrypted payment", (-0.45, -0.22, 1.75), 0.10, gold)
            anim.append(lambda p, o=packet, i=i: setattr(o, "location", (-0.45 + ((p / math.tau + i * 0.25) % 1) * 1.2, -0.22, 1.75)))
        card = cube("payment card", (-1.22, -0.82, 0.52), (0.95, 0.10, 0.58), teal)
        torus("contactless mark", (-0.96, -0.89, 0.57), 0.12, 0.025, gold, "Y")
    elif kind in ("data_center", "network", "pipeline"):
        if kind == "pipeline":
            for y in (-0.38, 0.38):
                rod("pipe cutaway rail", (-2.0, y, 1.45), (2.0, y, 1.45), 0.12, steel)
            for x in (-1.8, -0.6, 0.6, 1.8):
                torus("pipe cross section", (x, 0, 1.45), 0.48, 0.08, gold, "X")
            for i in range(5):
                droplet = sphere("fluid packet", (-1.8, 0, 1.45), 0.13, teal)
                anim.append(lambda p, o=droplet, i=i: setattr(o, "location", (-1.8 + ((p / math.tau + i * 0.2) % 1) * 3.6, 0, 1.45 + 0.08 * math.sin(p + i))))
        elif kind == "network":
            nodes = []
            for i, x in enumerate((-1.7, 0, 1.7)):
                cube("network router", (x, 0, 1.35), (0.95, 0.72, 0.72), steel)
                for k in range(3):
                    sphere("router port", (x - 0.24 + k * 0.24, -0.38, 1.35), 0.07, teal)
                nodes.append((x, -0.38, 1.35))
            for a, b in zip(nodes, nodes[1:]):
                rod("network link", a, b, 0.045, gold)
            for i in range(4):
                packet = sphere("network packet", (-1.45, -0.38, 1.35), 0.09, coral)
                anim.append(lambda p, o=packet, i=i: setattr(o, "location", (-1.45 + ((p / math.tau + i * 0.25) % 1) * 2.9, -0.38, 1.35)))
        else:
            count = 4
            for i in range(count):
                x = (i - (count - 1) / 2) * 1.35
                cube("server chassis", (x, 0, 1.25), (0.95, 1.05, 2.25), steel)
                for z in (0.52, 0.95, 1.38, 1.81, 2.24):
                    cube("server drawer", (x, -0.56, z), (0.75, 0.08, 0.30), navy)
                    sphere("status light", (x + 0.25, -0.62, z), 0.055, teal)
            for i in range(5):
                packet = sphere("data packet", (-2, -0.65, 2.55), 0.09, gold)
                anim.append(lambda p, o=packet, i=i: setattr(o, "location", (-2 + ((p / math.tau + i * 0.2) % 1) * 4, -0.65, 2.55)))
    else:
        left = gear("drive gear", -0.72, 0, 0.8, teal)
        right = gear("output gear", 0.72, 0, 0.8, gold)
        anim.append(lambda p, g=left: spin_gear(p, g, 1))
        anim.append(lambda p, g=right: spin_gear(p, g, -1))
    return anim


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not args:
        raise SystemExit("expected scene spec JSON")
    spec = json.loads(Path(args[0]).read_text(encoding="utf-8"))
    out = Path(spec["out_dir"])
    out.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    M = {
        "navy": material("Midnight", (0.018, 0.055, 0.13)),
        "steel": material("Satin alloy", (0.20, 0.34, 0.52), 0.55),
        "teal": material("Signal teal", (0.035, 0.72, 0.75), 0.25),
        "gold": material("Warm brass", (1.0, 0.48, 0.12), 0.45),
        "coral": material("Alert", (0.90, 0.15, 0.12)),
        "white": material("Ceramic", (0.8, 0.9, 1.0)),
        "glass": material("Glass", (0.035, 0.35, 0.48), 0.2),
    }
    kind = str(spec.get("model", "mechanism")).lower()
    updates = model(kind, M)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, 0))
    bpy.context.object.data.materials.append(M["navy"])
    bpy.ops.object.camera_add(location=(6, -10, 7))
    cam = bpy.context.object
    track(cam, (0, 0, 1.55))
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 8.4
    bpy.context.scene.camera = cam
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = int(spec.get("width", 640))
    scene.render.resolution_y = int(spec.get("height", 360))
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.fps = int(spec.get("fps", 12))
    scene.world.color = (0.018, 0.035, 0.085)
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = "BOTH"
    scene.display.shading.curvature_ridge_factor = 1.4
    scene.display.shading.curvature_valley_factor = 1.1
    frames = max(2, int(spec.get("frames", 48)))
    for i in range(frames):
        phase = math.tau * i / (frames - 1)
        for update in updates:
            update(phase)
        scene.frame_set(i + 1)
        scene.render.filepath = str(out / f"f_{i + 1:04d}.png")
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
