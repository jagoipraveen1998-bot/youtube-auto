"""Runs INSIDE Blender. Builds a toy-style 3D cartoon scene and renders it.

    blender -b --factory-startup -noaudio -P blender_scene.py -- spec.json

spec.json keys:
  mode        "loop" (animation frames) | "portraits" (one transparent still per character)
  out_dir     folder for frames / stills
  width, height, fps, frames
  engine      "EEVEE" | "CYCLES"
  samples     render samples
  seed        random seed for set dressing
  setting     meadow | farm | night | beach | snow | town | garden
  main        character id for the star of the scene
  friends     list of up to 2 character ids dancing in the background
  vertical    true for 9:16 framing
  portrait    path of a transparent close-up still of the main character (loop mode, optional)
  ids         list of character ids (portraits mode)
"""
import json
import math
import random
import sys
import time

import bpy
from mathutils import Euler, Vector

SPEC = json.load(open(sys.argv[sys.argv.index("--") + 1]))
RNG = random.Random(SPEC.get("seed", 7))
TAU = math.tau


# ------------------------------------------------------------------ basics
def hex_lin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


_MATS = {}


def mat(color, rough=0.45, emit=0.0):
    key = (color, rough, emit)
    if key in _MATS:
        return _MATS[key]
    m = bpy.data.materials.new(f"m_{color}_{rough}_{emit}")
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    lin = hex_lin(color)
    bsdf.inputs["Base Color"].default_value = (*lin, 1)
    bsdf.inputs["Roughness"].default_value = rough
    if emit:
        for name in ("Emission Color", "Emission"):
            if name in bsdf.inputs:
                bsdf.inputs[name].default_value = (*lin, 1)
                break
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emit
    if "Coat Weight" in bsdf.inputs and rough < 0.6:
        bsdf.inputs["Coat Weight"].default_value = 0.12
    m.diffuse_color = (*lin, 1)
    _MATS[key] = m
    return m


def link(o):
    bpy.context.scene.collection.objects.link(o)
    return o


def empty(name, loc=(0, 0, 0), parent=None):
    o = link(bpy.data.objects.new(name, None))
    o.location = loc
    if parent:
        keep_parent(o, parent)
    return o


def keep_parent(o, p):
    bpy.context.view_layer.update()
    o.parent = p
    o.matrix_parent_inverse = p.matrix_world.inverted()


def _finish(o, m, parent, smooth=True):
    o.data.materials.append(m)
    if smooth:
        for poly in o.data.polygons:
            poly.use_smooth = True
    if parent:
        keep_parent(o, parent)
    return o


def sphere(loc, r, color, parent=None, scale=(1, 1, 1), rough=0.45, emit=0.0, seg=32, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=max(8, seg // 2), radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    o.rotation_euler = rot
    return _finish(o, mat(color, rough, emit), parent)


def _orient(o, a, b):
    d = Vector(b) - Vector(a)
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")


def cyl(a, b, r, color, parent=None, rough=0.5, verts=24, r2=None):
    a, b = Vector(a), Vector(b)
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=max(1e-3, (b - a).length),
                                            location=(a + b) / 2)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=max(1e-3, (b - a).length),
                                        location=(a + b) / 2)
    o = bpy.context.active_object
    _orient(o, a, b)
    return _finish(o, mat(color, rough), parent)


def cone(a, b, r, color, parent=None, rough=0.5, verts=24):
    return cyl(a, b, r, color, parent, rough, verts, r2=0.0)


def box(loc, size, color, parent=None, bevel=0.08, rough=0.5, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.scale = size
    o.rotation_euler = rot
    if bevel:
        mod = o.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "NONE"
    return _finish(o, mat(color, rough), parent, smooth=bool(bevel))


def torus(loc, R, r, color, parent=None, rot=(0, 0, 0), rough=0.45):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=40, minor_segments=14,
                                     location=loc, rotation=rot)
    return _finish(bpy.context.active_object, mat(color, rough), parent)


def surf(c, r, x, z, push=0.0):
    """Point on the front (-Y) of a sphere of radius r centred at c."""
    y = -math.sqrt(max(0.0, r * r - x * x - z * z))
    return Vector((c[0] + x, c[1] + y - push, c[2] + z))


# ------------------------------------------------------------------ faces
def face(c, r, parent, eye_scale=1.0, eyes_top=False, wide_mouth=False, cheeks=True, sleepy=False):
    rig = {"eyes": []}
    ez = 0.12 * r if not eyes_top else 0.40 * r
    ex = 0.36 * r if not eyes_top else 0.32 * r
    er = 0.2 * r * eye_scale
    for sx in (-1, 1):
        # frogs and turtles have eyes that bulge off the top of the head, but the
        # pupils still face the camera so children can see where they are looking
        push = -0.02 * r if not eyes_top else 0.42 * er
        p = surf(c, r, sx * ex, ez, push=push)
        if eyes_top:
            p = Vector((p.x, p.y, p.z + 0.30 * er))
        white = sphere(p, er, "#ffffff", parent, scale=(1, 0.65 if not eyes_top else 0.9, 1.15 if not sleepy else 0.35),
                       rough=0.25)
        rig["eyes"].append(white)
        if not sleepy:
            fwd = (0.72 * er) if eyes_top else (0.11 * er + 0.06 * r)
            pp = p + Vector((0, -fwd, -0.03 * r))
            sphere(pp, er * 0.62, "#1b1b2f", parent, scale=(1, 0.6, 1.1), rough=0.15)
            sphere(pp + Vector((0.035 * r, -0.05 * r, 0.06 * r)), er * 0.2, "#ffffff", parent, emit=1.5, seg=12)
    mp = surf(c, r, 0, -0.33 * r, push=0.0)
    mouth = sphere(mp, 0.12 * r, "#7a1f3d", parent, scale=(1.8 if wide_mouth else 1.25, 0.5, 0.8), rough=0.4)
    rig["mouth"] = mouth
    if cheeks:
        for sx in (-1, 1):
            sphere(surf(c, r, sx * 0.6 * r, -0.2 * r, push=-0.01), 0.13 * r, "#ff8fb1", parent,
                   scale=(1, 0.35, 0.7), rough=0.6)
    return rig


# ------------------------------------------------------------------ animals
ANIMALS = {
    "cow": dict(body="#fbfbfb", snout="#f7b2c4", nose="#c4627f", ears="side", ear_col="#fbfbfb", ear_in="#f7b2c4",
                horns="#f5d76e", spots="#2f2f2f", tail="tuft", feet="#4a4a4a"),
    "dog": dict(body="#e3b27c", belly="#fff3e0", snout="#fff3e0", nose="#3b2a20", ears="floppy", ear_col="#8d5a36",
                tail="up", feet="#fff3e0"),
    "cat": dict(body="#ffb066", belly="#fff3e0", snout="#fff3e0", nose="#ff7f9f", ears="pointy", ear_col="#ffb066",
                ear_in="#ffc1cc", tail="up", feet="#fff3e0", stripes="#e8893a"),
    "duck": dict(body="#ffffff", beak="#ff9f1c", flat_beak=True, wings="#f2f2f2", feet="#ff9f1c", tail="feather"),
    "chick": dict(body="#ffe14d", beak="#ff9f1c", wings="#ffd23f", feet="#ff9f1c", tuft="#ffd23f"),
    "pig": dict(body="#ffb6c8", snout="disc", snout_col="#ff8fab", ears="pointy", ear_col="#ffb6c8", ear_in="#ff8fab",
                tail="curly", feet="#ff8fab"),
    "frog": dict(body="#6ccf5f", belly="#d9f7c7", eyes_top=True, wide_mouth=True, feet="#4caf50"),
    "bear": dict(body="#9b6a43", belly="#d9b48f", snout="#d9b48f", nose="#3b2a20", ears="round", ear_col="#9b6a43",
                 ear_in="#d9b48f", feet="#d9b48f"),
    "bunny": dict(body="#f5f5f5", belly="#ffffff", snout="#ffffff", nose="#ff7f9f", ears="long", ear_col="#f5f5f5",
                  ear_in="#ffc1cc", tail="fluffy", feet="#ffffff"),
    "mouse": dict(body="#a7a9b3", belly="#ece6f2", snout="#ece6f2", nose="#ff7f9f", ears="mouse", ear_col="#a7a9b3",
                  ear_in="#ffc1cc", tail="long", tail_col="#ffb3c6", feet="#ffb3c6"),
    "parrot": dict(body="#2ecc71", belly="#f1c40f", beak="#f39c12", wings="#e74c3c", tuft="#e74c3c",
                   tail="feather", feet="#7f8c8d"),
    "elephant": dict(body="#9fb3c8", ears="elephant", ear_col="#9fb3c8", ear_in="#f8c8d4", trunk=True, tail="tuft",
                     feet="#7d93aa"),
    "lion": dict(body="#f4b942", belly="#ffe0a3", snout="#ffe0a3", nose="#6d3b1f", ears="round", ear_col="#f4b942",
                 ear_in="#ffe0a3", mane="#c9631a", tail="tuft", feet="#ffe0a3"),
    "monkey": dict(body="#8b5a2b", belly="#e8c39e", snout="#e8c39e", nose="#4a2c14", ears="monkey",
                   ear_col="#e8c39e", tail="long", tail_col="#8b5a2b", feet="#e8c39e"),
    "sheep": dict(body="#ffffff", head_col="#4a4a4a", wool=True, ears="floppy", ear_col="#4a4a4a", feet="#4a4a4a"),
    "owl": dict(body="#a0703c", belly="#f3dcb8", beak="#f39c12", wings="#8a5a2b", ears="tufts", ear_col="#a0703c",
                eye_scale=1.45, feet="#f39c12"),
    "turtle": dict(body="#7dcb6a", shell="#8d6e3f", feet="#7dcb6a"),
    "giraffe": dict(body="#f6c453", spots="#c8762b", neck=0.6, ossicones=True, ears="pointy", ear_col="#f6c453",
                    ear_in="#f3d9a4", snout="#f3d9a4", nose="#6d3b1f", tail="tuft", feet="#6d3b1f"),
    "dino": dict(body="#7ed957", belly="#e6f9c7", snout="big", snout_col="#7ed957", spikes="#ff9f1c", tail="dino",
                 feet="#5bb83a"),
}


def build_animal(kind, root):
    a = ANIMALS[kind]
    body = a["body"]
    rig = {"root": root, "arms": [], "ears": [], "tail": None}
    # body + belly
    if a.get("wool"):
        for i in range(14):
            ang = i / 14 * TAU
            for zz in (0.5, 0.78):
                sphere((0.36 * math.cos(ang), 0.33 * math.sin(ang), zz), 0.2, body, root, rough=0.9, seg=18)
        sphere((0, 0, 0.64), 0.38, body, root, rough=0.9)
    else:
        sphere((0, 0, 0.62), 0.42, body, root, scale=(1, 0.92, 1.08))
    if a.get("belly"):
        sphere((0, -0.2, 0.56), 0.3, a["belly"], root, scale=(1, 0.55, 1.1))
    if a.get("stripes"):
        for z in (0.5, 0.66, 0.82):
            torus((0, 0.05, z), 0.38, 0.03, a["stripes"], root, rot=(0, 0, 0))
    if a.get("spots") and not a.get("wool"):
        for i in range(6):
            ang = RNG.uniform(0, TAU)
            z = RNG.uniform(0.45, 0.85)
            p = Vector((0.4 * math.cos(ang), 0.37 * math.sin(ang) + 0.04, z))
            sphere(p, RNG.uniform(0.08, 0.13), a["spots"], root, scale=(0.45, 1, 1), rot=(0, 0, ang))
    if a.get("shell"):
        sphere((0, 0.12, 0.72), 0.5, a["shell"], root, scale=(1, 0.95, 0.75), rough=0.6)
        for i in range(6):
            ang = i / 6 * TAU
            sphere((0.3 * math.cos(ang), 0.12 + 0.3 * math.sin(ang), 1.02), 0.1, "#6b5330", root, scale=(1, 1, 0.3))
    if a.get("spikes"):
        for i, z in enumerate((1.0, 0.85, 0.68, 0.5)):
            cone((0, 0.38 - 0.0 * i, z), (0, 0.6, z + 0.1), 0.08, a["spikes"], root)
    # feet
    for sx in (-1, 1):
        sphere((sx * 0.2, -0.1, 0.1), 0.13, a.get("feet", body), root, scale=(1, 1.35, 0.7))
    # arms / wings (pivot at the shoulder so they can wave)
    for sx in (-1, 1):
        sh = empty(f"arm{sx}", (sx * 0.38, 0, 0.82), root)
        if a.get("wings"):
            sphere((sx * 0.5, 0.02, 0.66), 0.18, a["wings"], sh, scale=(0.35, 0.8, 1.3))
        else:
            sphere((sx * 0.5, -0.02, 0.66), 0.1, body if not a.get("wool") else a.get("head_col", body), sh,
                   scale=(0.85, 0.85, 1.55))
        rig["arms"].append((sh, sx))
    # neck + head
    neck = a.get("neck", 0.0)
    hz = 1.18 + neck
    if neck:
        cyl((0, 0, 0.9), (0, 0, hz - 0.2), 0.13, body, root)
        for i in range(4):
            sphere((RNG.choice((-1, 1)) * 0.1, -0.08, 1.0 + i * neck / 4), 0.05, a["spots"], root,
                   scale=(1, 0.5, 1))
    head = empty("head", (0, 0, hz), root)
    rig["head"] = head
    hc = Vector((0, 0, hz))
    hr = 0.42
    head_col = a.get("head_col", body)
    sphere(hc, hr, head_col, head, scale=(1.05, 0.95, 0.95))
    if a.get("mane"):
        for i in range(14):
            ang = i / 14 * TAU
            sphere(hc + Vector((0.5 * math.cos(ang), 0.12, 0.5 * math.sin(ang))), 0.17, a["mane"], head, rough=0.8)
    # ears
    et, ec, ei = a.get("ears"), a.get("ear_col", body), a.get("ear_in")
    for sx in (-1, 1):
        if et == "round":
            o = sphere(hc + Vector((sx * 0.3, 0.02, 0.3)), 0.13, ec, head, scale=(1, 0.5, 1))
            if ei:
                sphere(hc + Vector((sx * 0.3, -0.04, 0.3)), 0.08, ei, head, scale=(1, 0.4, 1))
        elif et == "mouse":
            o = sphere(hc + Vector((sx * 0.36, 0.03, 0.34)), 0.21, ec, head, scale=(1, 0.32, 1))
            sphere(hc + Vector((sx * 0.36, -0.03, 0.34)), 0.14, ei, head, scale=(1, 0.3, 1))
        elif et == "pointy":
            o = cone(hc + Vector((sx * 0.25, 0, 0.26)), hc + Vector((sx * 0.36, 0, 0.55)), 0.13, ec, head)
            if ei:
                cone(hc + Vector((sx * 0.25, -0.05, 0.28)), hc + Vector((sx * 0.34, -0.06, 0.5)), 0.07, ei, head)
        elif et == "floppy":
            o = sphere(hc + Vector((sx * 0.42, 0.02, 0.06)), 0.13, ec, head, scale=(0.55, 0.55, 1.5),
                       rot=(0, sx * 0.35, 0))
        elif et == "long":
            o = sphere(hc + Vector((sx * 0.16, 0.02, 0.62)), 0.11, ec, head, scale=(0.75, 0.45, 2.5),
                       rot=(0, sx * 0.15, 0))
            sphere(hc + Vector((sx * 0.16, -0.03, 0.62)), 0.07, ei, head, scale=(0.7, 0.4, 2.2),
                   rot=(0, sx * 0.15, 0))
        elif et == "side":
            o = sphere(hc + Vector((sx * 0.46, 0.02, 0.15)), 0.12, ec, head, scale=(1.7, 0.5, 0.7))
        elif et == "elephant":
            o = sphere(hc + Vector((sx * 0.48, 0.08, 0.02)), 0.32, ec, head, scale=(1, 0.22, 1.2))
            sphere(hc + Vector((sx * 0.47, 0.03, 0.02)), 0.22, ei, head, scale=(1, 0.2, 1.1))
        elif et == "monkey":
            o = sphere(hc + Vector((sx * 0.45, 0.04, 0.05)), 0.15, ec, head, scale=(0.6, 0.6, 1))
        elif et == "tufts":
            o = cone(hc + Vector((sx * 0.25, 0, 0.3)), hc + Vector((sx * 0.38, 0, 0.58)), 0.1, ec, head)
        else:
            o = None
        if o is not None:
            rig["ears"].append((o, sx))
    if a.get("horns"):
        for sx in (-1, 1):
            cone(hc + Vector((sx * 0.18, 0.02, 0.33)), hc + Vector((sx * 0.3, 0.02, 0.52)), 0.06, a["horns"], head)
    if a.get("ossicones"):
        for sx in (-1, 1):
            cyl(hc + Vector((sx * 0.12, 0.02, 0.32)), hc + Vector((sx * 0.14, 0.02, 0.55)), 0.035, a["body"], head)
            sphere(hc + Vector((sx * 0.14, 0.02, 0.57)), 0.06, "#c8762b", head)
    if a.get("tuft"):
        for i, dx in enumerate((-0.06, 0, 0.06)):
            sphere(hc + Vector((dx, 0, hr + 0.06 + 0.04 * (i == 1))), 0.06, a["tuft"], head, scale=(0.6, 0.6, 1.6))
    # snout / beak / trunk
    sn = a.get("snout")
    if sn == "disc":
        p = surf(hc, hr, 0, -0.1, push=0.02)
        cyl(p + Vector((0, 0.05, 0)), p + Vector((0, -0.08, 0)), 0.15, a["snout_col"], head)
        for sx in (-1, 1):
            sphere(p + Vector((sx * 0.05, -0.085, 0)), 0.035, "#c2185b", head, scale=(1, 0.4, 1.3))
    elif sn == "big":
        sphere(surf(hc, hr, 0, -0.08, push=0.05), 0.24, a["snout_col"], head, scale=(1.2, 0.85, 0.75))
    elif sn:
        sp = surf(hc, hr, 0, -0.12, push=0.03)
        sphere(sp, 0.17, sn, head, scale=(1.25, 0.7, 0.85))
        sphere(sp + Vector((0, -0.12, 0.06)), 0.06, a.get("nose", "#333333"), head, scale=(1.3, 0.8, 0.9), rough=0.2)
    if a.get("beak"):
        bp = surf(hc, hr, 0, -0.06, push=-0.02)
        if a.get("flat_beak"):
            sphere(bp + Vector((0, -0.08, 0)), 0.14, a["beak"], head, scale=(1.3, 1.1, 0.45))
        else:
            cone(bp + Vector((0, 0.04, 0)), bp + Vector((0, -0.2, -0.06)), 0.1, a["beak"], head)
    if a.get("trunk"):
        p = surf(hc, hr, 0, -0.1, push=-0.02)
        for i in range(6):
            t = i / 5
            sphere(p + Vector((0, -0.1 - 0.12 * t, -0.08 - 0.32 * t + 0.25 * t * t)), 0.11 - 0.04 * t, body, head)
    fr = face(hc, hr, head, eye_scale=a.get("eye_scale", 1.0), eyes_top=a.get("eyes_top", False),
              wide_mouth=a.get("wide_mouth", False))
    if a.get("snout") or a.get("trunk"):  # mouth sits under the snout
        fr["mouth"].location.z -= 0.06
        fr["mouth"].location.y -= 0.02
    rig.update(fr)
    # tail (pivot at the back so it can wag)
    tt = a.get("tail")
    if tt:
        tp = empty("tail", (0, 0.38, 0.5), root)
        tc = a.get("tail_col", body)
        if tt == "curly":
            torus((0, 0.47, 0.6), 0.07, 0.025, tc, tp, rot=(0, math.pi / 2, 0))
        elif tt == "fluffy":
            sphere((0, 0.45, 0.45), 0.12, tc, tp, rough=0.9)
        elif tt == "feather":
            for dx in (-0.06, 0, 0.06):
                sphere((dx, 0.48, 0.55), 0.07, a.get("wings", tc), tp, scale=(0.5, 1.8, 0.4), rot=(0.5, 0, 0))
        elif tt == "dino":
            for i in range(5):
                t = i / 4
                sphere((0, 0.42 + 0.22 * i, 0.42 - 0.06 * i), 0.18 - 0.03 * i, body, tp)
        else:  # thin / up / long / tuft
            n = 7 if tt == "long" else 5
            for i in range(n):
                t = i / (n - 1)
                up = 0.35 if tt in ("up", "long") else 0.2
                sphere((0, 0.42 + 0.09 * i, 0.5 + up * t * t), 0.035, tc, tp, seg=12)
            if tt == "tuft":
                sphere((0, 0.42 + 0.09 * (n - 1), 0.5 + 0.2), 0.07, a.get("mane", "#5a3b22"), tp)
        rig["tail"] = tp
    return rig


# ------------------------------------------------------------------ object characters
def build_object(kind, root):
    rig = {"root": root, "arms": [], "ears": [], "tail": None}

    def little_arms(z, col, dx=0.45):
        for sx in (-1, 1):
            sh = empty(f"arm{sx}", (sx * dx * 0.85, 0, z), root)
            sphere((sx * dx, -0.02, z - 0.15), 0.08, col, sh, scale=(0.8, 0.8, 1.6))
            rig["arms"].append((sh, sx))

    def feet(col):
        for sx in (-1, 1):
            sphere((sx * 0.18, -0.08, 0.08), 0.11, col, root, scale=(1, 1.35, 0.65))

    head = empty("head", (0, 0, 0.9), root)
    rig["head"] = head
    if kind == "banana":
        pts = []
        for i in range(9):
            t = i / 8 - 0.5
            pts.append(Vector((0.35 * t * 2 * 0.4, 0, 0.9 + 1.1 * t)) + Vector((0.18 * (1 - (2 * t) ** 2), 0, 0)))
        for i, p in enumerate(pts):
            r = 0.3 * (1 - (abs(i - 4) / 4.5) ** 2) + 0.06
            sphere(p, r, "#ffe135", head if 2 <= i <= 6 else root, rough=0.5)
        sphere(pts[0] + Vector((0, 0, -0.05)), 0.07, "#6d4c1f", root)
        sphere(pts[-1] + Vector((0, 0, 0.05)), 0.07, "#6d4c1f", root)
        rig.update(face(Vector((0.18, 0, 0.95)), 0.3, head))
        little_arms(0.95, "#ffe135", 0.42)
        feet("#a0522d")
    elif kind in ("moon", "sun", "star", "cloud", "ball"):
        col = {"moon": "#fff3a6", "sun": "#ffcc33", "star": "#ffe14d", "cloud": "#ffffff", "ball": "#ff5a5f"}[kind]
        emit = 0.6 if kind in ("moon", "sun", "star") else 0.0
        c = Vector((0, 0, 0.95))
        if kind == "cloud":
            for dx, dz, r in ((0, 0.1, 0.45), (-0.4, -0.05, 0.33), (0.4, -0.05, 0.33), (-0.2, 0.32, 0.3), (0.22, 0.3, 0.32)):
                sphere(c + Vector((dx, 0.05, dz)), r, col, head, rough=0.9)
        else:
            sphere(c, 0.5, col, head, emit=emit, rough=0.35)
        if kind == "sun":
            for i in range(10):
                ang = i / 10 * TAU
                cone(c + Vector((0.55 * math.cos(ang), 0.05, 0.55 * math.sin(ang))),
                     c + Vector((0.85 * math.cos(ang), 0.05, 0.85 * math.sin(ang))), 0.1, "#ff9f1c", head)
        if kind == "star":
            for i in range(5):
                ang = math.pi / 2 + i / 5 * TAU
                cone(c + Vector((0.4 * math.cos(ang), 0, 0.4 * math.sin(ang))),
                     c + Vector((0.95 * math.cos(ang), 0, 0.95 * math.sin(ang))), 0.26, col, head)
        if kind == "ball":
            torus(c, 0.5, 0.05, "#ffffff", head, rot=(0, 0, 0))
            torus(c, 0.5, 0.05, "#3fa9f5", head, rot=(math.pi / 2, 0, 0))
        if kind == "moon":
            cone(c + Vector((0.05, 0.05, 0.42)), c + Vector((0.35, 0.05, 0.95)), 0.28, "#5b6cff", head)  # nightcap
            sphere(c + Vector((0.37, 0.05, 0.98)), 0.09, "#ffffff", head)
        rig.update(face(c, 0.5, head, sleepy=(kind == "moon")))
        little_arms(0.9, "#ffd23f" if kind != "cloud" else "#ffffff", 0.56)
        feet("#ff9f1c" if kind != "cloud" else "#dfe7f0")
    elif kind in ("bus", "rickshaw", "train"):
        col = {"bus": "#ffcc00", "rickshaw": "#2ecc71", "train": "#e74c3c"}[kind]
        w = {"bus": 1.5, "rickshaw": 1.0, "train": 1.4}[kind]
        box((0, 0.1, 0.75), (w, 0.9, 0.9), col, head)
        if kind == "rickshaw":
            box((0, 0.1, 1.28), (w * 1.05, 0.95, 0.12), "#ffcc00", head)
        if kind == "train":
            cyl((-0.1, -0.05, 0.6), (-0.1, -0.05, 1.35), 0.12, "#333333", head)  # chimney
            box((0.35, 0.1, 1.3), (0.6, 0.85, 0.35), "#c0392b", head)
        for sx in (-1, 1):
            box((sx * w * 0.28, -0.36, 0.95), (w * 0.3, 0.05, 0.3), "#9ad3ff", head, bevel=0.04, rough=0.1)
        for sx in (-1, 1):
            for sy in ((-0.2, 0.4) if kind != "rickshaw" else (0.1,)):
                cyl((sx * (w / 2 + 0.03), sy, 0.22), (sx * (w / 2 - 0.1), sy, 0.22), 0.2, "#2b2b2b", root)
        rig.update(face(Vector((0, -0.05, 0.65)), 0.45, head, cheeks=True))
        for e in rig["eyes"]:
            e.location.y -= 0.02
    elif kind == "robot":
        box((0, 0, 0.6), (0.7, 0.55, 0.65), "#8fa3bf", root, rough=0.3)
        box((0, -0.29, 0.6), (0.35, 0.02, 0.3), "#5bc0eb", root, bevel=0.03, rough=0.2)
        box((0, 0, 1.25), (0.75, 0.6, 0.6), "#b8c7da", head, rough=0.3)
        cyl((0, 0, 1.55), (0, 0, 1.75), 0.025, "#555555", head)
        sphere((0, 0, 1.78), 0.06, "#ff5a5f", head, emit=2.0)
        rig.update(face(Vector((0, 0.05, 1.22)), 0.35, head, cheeks=True))
        little_arms(0.8, "#8fa3bf", 0.45)
        feet("#5f6f87")
    elif kind == "snowman":
        sphere((0, 0, 0.42), 0.45, "#ffffff", root, rough=0.8)
        sphere((0, 0, 0.98), 0.33, "#ffffff", root, rough=0.8)
        c = Vector((0, 0, 1.45))
        sphere(c, 0.27, "#ffffff", head, rough=0.8)
        cone(surf(c, 0.27, 0, -0.02), surf(c, 0.27, 0, -0.02) + Vector((0, -0.25, 0)), 0.05, "#ff8c1a", head)
        cyl(c + Vector((0, 0, 0.2)), c + Vector((0, 0, 0.5)), 0.2, "#222222", head)
        cyl(c + Vector((0, 0, 0.2)), c + Vector((0, 0, 0.24)), 0.3, "#222222", head)
        torus((0, 0, 1.22), 0.27, 0.06, "#e53935", root)
        rig.update(face(c, 0.27, head, cheeks=True))
        for sx in (-1, 1):
            sh = empty(f"arm{sx}", (sx * 0.3, 0, 1.05), root)
            cyl((sx * 0.3, 0, 1.05), (sx * 0.75, 0, 1.3), 0.025, "#6d4c1f", sh)
            rig["arms"].append((sh, sx))
    elif kind == "cupcake":
        cyl((0, 0, 0.0), (0, 0, 0.6), 0.36, "#ff9ec7", root, r2=0.46)
        c = Vector((0, 0, 0.85))
        sphere(c, 0.45, "#fff0f6", head, scale=(1, 1, 0.75), rough=0.6)
        sphere(c + Vector((0, 0, 0.4)), 0.1, "#e53935", head, rough=0.2)
        for i in range(10):
            ang = i / 10 * TAU
            box(c + Vector((0.3 * math.cos(ang), 0.3 * math.sin(ang), 0.2)), (0.08, 0.025, 0.025),
                RNG.choice(["#3fa9f5", "#ffcc00", "#2ecc71", "#9b59b6"]), head, bevel=0.01, rot=(0, 0, ang))
        rig.update(face(Vector((0, 0, 0.42)), 0.42, root))
        little_arms(0.5, "#ff9ec7", 0.5)
    else:  # blob buddy
        sphere((0, 0, 0.7), 0.6, "#b388ff", head, scale=(1, 0.9, 1.05))
        rig.update(face(Vector((0, 0, 0.8)), 0.58, head))
        little_arms(0.75, "#b388ff", 0.62)
        feet("#7c4dff")
    return rig


OBJECT_KINDS = {"banana", "moon", "sun", "star", "cloud", "ball", "bus", "rickshaw", "train", "robot",
                "snowman", "cupcake", "blob"}
ALL_IDS = sorted(set(ANIMALS) | OBJECT_KINDS)


def build_character(kind, name, loc, scale, facing=0.0):
    root = empty(f"char_{name}", (0, 0, 0))
    rig = build_animal(kind, root) if kind in ANIMALS else build_object(kind if kind in OBJECT_KINDS else "blob", root)
    bpy.context.view_layer.update()
    root.location = loc
    root.scale = (scale, scale, scale)
    root.rotation_euler = (0, 0, facing)
    rig["base"] = {"loc": Vector(loc), "scale": scale, "rot": facing}
    rig["kind"] = kind
    return rig


# ------------------------------------------------------------------ settings
SETTINGS = {
    "meadow": dict(sky=("#bfe9ff", "#5fb8ff"), ground="#86d36b", hill="#6cc25a", trees="round"),
    "garden": dict(sky=("#d6f3ff", "#7cc7ff"), ground="#8fdc72", hill="#74c95e", trees="round", flowers=40,
                   mushrooms=True),
    "farm": dict(sky=("#ffe9c7", "#7cc7ff"), ground="#9bd46a", hill="#86c25a", trees="round", barn=True, fence=True),
    "night": dict(sky=("#3b2a6b", "#0d1640"), ground="#2f6b4f", hill="#245a42", trees="round", night=True),
    "beach": dict(sky=("#d9f6ff", "#4fc3f7"), ground="#f3d9a4", hill=None, trees="palm", sea=True),
    "snow": dict(sky=("#eef6ff", "#9ccfff"), ground="#f7fbff", hill="#e3f0fb", trees="pine", snow=True),
    "town": dict(sky=("#dff4ff", "#6ec6ff"), ground="#8fd26e", hill="#78c25c", trees="round", houses=True,
                 toytown=True, flowers=26),
}


def tree(x, y, kind, s=1.0):
    if kind == "palm":
        prev = Vector((x, y, 0))
        for i in range(6):
            p = Vector((x + 0.08 * i * i * 0.1, y, 0.45 * (i + 1))) * 1
            cyl(prev, p, 0.12 * s, "#a0743c")
            prev = p
        for i in range(6):
            ang = i / 6 * TAU
            sphere(prev + Vector((0.7 * math.cos(ang), 0.7 * math.sin(ang), -0.15)), 0.22, "#3fae49",
                   scale=(2.6, 0.7, 0.3), rot=(0, 0.35, ang))
        for dx in (-0.12, 0.12):
            sphere(prev + Vector((dx, -0.1, -0.2)), 0.12, "#7b4a1e")
    elif kind == "pine":
        cyl((x, y, 0), (x, y, 0.5 * s), 0.12 * s, "#7b4a1e")
        for i, (r, z) in enumerate(((1.0, 0.4), (0.78, 1.05), (0.55, 1.6))):
            cone((x, y, z * s), (x, y, (z + 0.95) * s), r * s, "#2e7d4f")
            cone((x, y, (z + 0.6) * s), (x, y, (z + 0.95) * s), r * s * 0.38, "#ffffff")
    else:
        cyl((x, y, 0), (x, y, 1.1 * s), 0.15 * s, "#8d5a36")
        for dx, dz, r in ((0, 1.6, 0.75), (-0.45, 1.3, 0.55), (0.45, 1.35, 0.55), (0.1, 2.05, 0.5)):
            sphere((x + dx * s, y, dz * s), r * s, RNG.choice(["#4caf50", "#5cbf60", "#43a047"]), rough=0.8)
        if RNG.random() < 0.5:
            for _ in range(4):
                sphere((x + RNG.uniform(-0.5, 0.5) * s, y - 0.5 * s, RNG.uniform(1.2, 2.0) * s), 0.09 * s,
                       "#ff5252", rough=0.3)


def flower(x, y):
    cyl((x, y, 0), (x, y, 0.28), 0.015, "#3f9b3a")
    col = RNG.choice(["#ff6f91", "#ffd23f", "#ffffff", "#c38fff", "#ff9f1c"])
    for i in range(5):
        ang = i / 5 * TAU
        sphere((x + 0.07 * math.cos(ang), y, 0.3 + 0.07 * math.sin(ang)), 0.05, col, scale=(1, 0.4, 1), seg=12)
    sphere((x, y - 0.01, 0.3), 0.04, "#ffb300", seg=12)


def build_set(name, vertical):
    st = SETTINGS.get(name, SETTINGS["meadow"])
    scene = bpy.context.scene
    world = bpy.data.worlds.new("world")
    scene.world = world
    world.color = hex_lin(st["sky"][1])  # used by the Workbench engine
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes.get("Background")
    try:
        tc = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        nt.links.new(tc.outputs["Window"], sep.inputs[0])
        nt.links.new(sep.outputs["Y"], ramp.inputs["Fac"])
        ramp.color_ramp.elements[0].color = (*hex_lin(st["sky"][0]), 1)
        ramp.color_ramp.elements[1].color = (*hex_lin(st["sky"][1]), 1)
        nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    except Exception as exc:  # flat sky if the gradient nodes are unavailable
        print("sky gradient skipped:", exc)
        bg.inputs["Color"].default_value = (*hex_lin(st["sky"][1]), 1)
    bg.inputs["Strength"].default_value = 0.35 if st.get("night") else 1.0

    bpy.ops.mesh.primitive_plane_add(size=160, location=(0, 0, 0))
    _finish(bpy.context.active_object, mat(st["ground"], 0.9), None, smooth=False)
    if st.get("hill"):
        for x, y, r in ((-14, 26, 11), (6, 30, 13), (22, 24, 10), (-26, 20, 9)):
            sphere((x, y, -r * 0.55), r, st["hill"], rough=0.95, seg=48)
    if st.get("sea"):
        bpy.ops.mesh.primitive_plane_add(size=160, location=(0, 88, 0.02))
        _finish(bpy.context.active_object, mat("#29b6f6", 0.15), None, smooth=False)
        for i in range(5):
            sphere((RNG.uniform(-4, 4), RNG.uniform(-1.5, 1.5), 0.05), 0.12, "#fff3e0", scale=(1, 1, 0.4))
    side = 4.2 if not vertical else 2.7
    for sx in (-1, 1):
        tree(sx * (side + RNG.uniform(0, 1.2)), RNG.uniform(3, 5), st["trees"], RNG.uniform(1.0, 1.3))
        tree(sx * (side + 3.5 + RNG.uniform(0, 2)), RNG.uniform(8, 12), st["trees"], RNG.uniform(1.1, 1.5))
    for _ in range(3):
        tree(RNG.uniform(-10, 10), RNG.uniform(14, 22), st["trees"], RNG.uniform(1.2, 1.8))
    if st["trees"] != "palm":
        for _ in range(st.get("flowers", 18)):
            x = RNG.uniform(-7, 7)
            if abs(x) < 1.0:
                x += 2.2 * (1 if x >= 0 else -1)
            flower(x, RNG.uniform(-2.2, 4))
    if st.get("mushrooms"):
        for sx in (-1, 1):
            x, y = sx * RNG.uniform(1.8, 3), RNG.uniform(-1.6, -0.6)
            cyl((x, y, 0), (x, y, 0.3), 0.07, "#fff8e1")
            sphere((x, y, 0.32), 0.2, "#e53935", scale=(1, 1, 0.6))
            for i in range(4):
                sphere((x + 0.1 * math.cos(i * 1.6), y - 0.12, 0.4), 0.03, "#ffffff", seg=10)
    if st.get("barn"):
        box((-5.5, 7, 1.3), (3.2, 2.6, 2.6), "#d84a3a", bevel=0.05)
        cone((-5.5, 7, 2.6), (-5.5, 7, 4.0), 2.4, "#7b3f2b", verts=4)
        box((-5.5, 5.68, 0.8), (1.0, 0.05, 1.5), "#ffffff", bevel=0.02)
        for i in range(3):
            cyl((3.6 + i * 1.1, 4.5, 0.4), (3.6 + i * 1.1, 4.5, 0.85), 0.45, "#f4c542")
    if st.get("fence"):
        for i in range(14):
            x = -9 + i * 1.4
            if abs(x) < 1.0:
                continue
            box((x, 2.6, 0.45), (0.12, 0.12, 0.9), "#c28a55", bevel=0.03)
        for z in (0.35, 0.7):
            box((0, 2.6, z), (18, 0.07, 0.1), "#d9a46c", bevel=0.02)
    if st.get("houses"):
        cols = ["#ff8a80", "#82b1ff", "#ffd180", "#b9f6ca", "#ea80fc"]
        roofs = ["#8d4b3b", "#5d8aa8", "#c2703d", "#6b8e5a", "#9a6fb0"]
        for i, x in enumerate((-8.5, -5.0, 5.0, 8.5)):
            box((x, 8, 1.2), (2.4, 2.2, 2.4), cols[i % 5], bevel=0.06)
            cone((x, 8, 2.4), (x, 8, 3.6), 1.9, roofs[i % 5], verts=4)
            box((x, 6.88, 0.75), (0.6, 0.05, 1.1), "#6d4c41", bevel=0.02)
            sphere((x + 0.22, 6.82, 0.75), 0.05, "#ffd54f", rough=0.2)  # door knob
            for dx in (-0.65, 0.65):
                box((x + dx, 6.88, 1.75), (0.45, 0.05, 0.45), "#bbdefb", bevel=0.02, rough=0.1)
            cyl((x, 7.4, 3.3), (x, 7.4, 4.1), 0.18, "#b0564a")          # chimney
        box((0, 5.5, 0.01), (40, 2.2, 0.02), "#9e9e9e", bevel=0)
    if st.get("toytown"):
        toy_town()
    # sky decorations
    clouds = []
    for i in range(5):
        c = Vector((RNG.uniform(-12, 12), RNG.uniform(18, 26), RNG.uniform(6.5, 9.5)))
        grp = empty(f"cloud{i}", c)
        for dx, dz, r in ((0, 0, 1.0), (-1.0, -0.25, 0.7), (1.0, -0.25, 0.75), (0.45, 0.4, 0.7)):
            col = "#ffffff" if not st.get("night") else "#6a6aa8"
            sphere(c + Vector((dx, 0, dz)), r, col, grp, rough=1.0, seg=20)
        clouds.append(grp)
    if st.get("night"):
        sphere((7, 30, 11), 2.0, "#fff6c2", emit=4.0)
        for _ in range(60):
            sphere((RNG.uniform(-30, 30), RNG.uniform(32, 40), RNG.uniform(5, 22)), RNG.uniform(0.06, 0.14),
                   "#ffffff", emit=6.0, seg=8)
    elif not st.get("snow"):
        sphere((-9, 32, 13), 2.2, "#fff176", emit=3.0)
    return st, clouds


def toy_town():
    """A cheerful little town square: shops, lamp posts, a postbox and bunting."""
    # two shop fronts facing the camera, set back behind the road
    shops = (("#ffd3e0", "#e05c8a", -2.6), ("#d6f0ff", "#3f8fd0", 2.6))
    for wall, awning, x in shops:
        box((x, 11.2, 1.5), (3.0, 2.6, 3.0), wall, bevel=0.06)
        cone((x, 11.2, 3.0), (x, 11.2, 4.1), 2.4, "#7b4a4a", verts=4)
        box((x, 9.85, 1.0), (1.0, 0.08, 2.0), "#7a4b2a", bevel=0.03)          # doorway
        box((x, 9.88, 2.5), (2.2, 0.10, 0.30), awning, bevel=0.04)            # awning board
        for i in range(7):                                                     # striped awning
            box((x - 0.95 + i * 0.32, 9.72, 2.22), (0.16, 0.42, 0.06),
                awning if i % 2 else "#ffffff", bevel=0.02, rot=(0.5, 0, 0))
    # pavement and a road across the middle distance
    box((0, 6.9, 0.03), (44, 1.0, 0.06), "#e8e2d4", bevel=0)
    box((0, 5.5, 0.04), (44, 2.0, 0.04), "#8d8d8d", bevel=0)
    for i in range(11):                                                        # dashes down the road
        box((-10 + i * 2.0, 5.5, 0.07), (0.8, 0.10, 0.02), "#fdfdfd", bevel=0)
    # lamp posts
    for x in (-6.2, 6.2):
        cyl((x, 6.6, 0), (x, 6.6, 2.9), 0.075, "#37474f")
        cyl((x, 6.6, 2.9), (x, 6.6, 3.05), 0.22, "#37474f")
        sphere((x, 6.6, 3.22), 0.26, "#fff6c2", emit=2.2, rough=0.2)
    # a round red postbox, and a bench
    cyl((-4.2, 6.5, 0), (-4.2, 6.5, 1.15), 0.33, "#d84a3a")
    sphere((-4.2, 6.5, 1.15), 0.33, "#d84a3a", scale=(1, 1, 0.55))
    box((-4.2, 6.16, 0.85), (0.34, 0.06, 0.09), "#2b2b2b", bevel=0.01)
    box((4.3, 6.6, 0.42), (1.5, 0.45, 0.10), "#c28a55", bevel=0.03)
    for dx in (-0.6, 0.6):
        box((4.3 + dx, 6.6, 0.2), (0.12, 0.42, 0.40), "#8d5a36", bevel=0.02)
    box((4.3, 6.82, 0.72), (1.5, 0.10, 0.45), "#c28a55", bevel=0.03)
    # bunting between the lamp posts
    cols = ["#ff5a5f", "#ffd23f", "#3fa9f5", "#2ecc71", "#c38fff"]
    for i in range(13):
        t = i / 12
        x = -6.2 + t * 12.4
        z = 2.75 - 0.55 * math.sin(math.pi * t)
        cone((x, 6.6, z), (x, 6.6, z - 0.34), 0.17, cols[i % 5], verts=3)


def lights(st):
    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy = 1.2 if st.get("night") else 3.6
    sun.angle = 0.25
    sun.color = (0.75, 0.8, 1.0) if st.get("night") else (1.0, 0.97, 0.92)
    o = link(bpy.data.objects.new("sun", sun))
    o.rotation_euler = (math.radians(52), 0, math.radians(-28))
    if st.get("night"):  # warm cosy light on the characters
        p = bpy.data.lights.new("lamp", "POINT")
        p.energy = 450
        p.color = (1.0, 0.85, 0.6)
        p.shadow_soft_size = 1.5
        lo = link(bpy.data.objects.new("lamp", p))
        lo.location = (1.5, -3.5, 3.5)


def balloons(n, vertical):
    out = []
    cols = ["#ff5a5f", "#3fa9f5", "#ffd23f", "#2ecc71", "#c38fff"]
    for i in range(n):
        x = (-1.6 + 1.6 * i) * (0.65 if vertical else 1.0) + RNG.uniform(-0.3, 0.3)
        grp = empty(f"balloon{i}", (x, 2.6 + RNG.uniform(0, 1), 2.6 + RNG.uniform(0, 0.8)))
        c = grp.location.copy()
        sphere(c, 0.35, cols[i % 5], grp, scale=(1, 1, 1.18), rough=0.2)
        cone(c + Vector((0, 0, -0.4)), c + Vector((0, 0, -0.5)), 0.07, cols[i % 5], grp)
        cyl(c + Vector((0, 0, -0.45)), c + Vector((0, 0, -1.9)), 0.008, "#ffffff", grp)
        out.append(grp)
    return out


def snowflakes(n):
    flakes = []
    for _ in range(n):
        o = sphere((RNG.uniform(-6, 6), RNG.uniform(-2, 6), 0), 0.05, "#ffffff", emit=0.6, seg=8)
        flakes.append((o, RNG.random(), o.location.copy()))
    return flakes


# ------------------------------------------------------------------ animation
ACTIONS = ["dance", "jump", "spin", "walk", "peek", "wave", "sleep", "cheer", "chase"]


def motion(act, k, beat, u, s):
    """What this character is doing right now. Every action loops seamlessly."""
    squash = (1 - s) ** 3
    hop = 0.2 if k == 0 else 0.13
    mo = {"dx": 0.0, "dy": 0.0, "dz": 0.0, "sx": 1.0, "sy": 1.0, "sz": 1.0,
          "rx": 0.0, "ry": 0.0, "rz": 0.0, "arm": None, "droop": 0.0}
    if act == "jump":
        mo["dz"] = hop * 2.4 * s
        mo["sx"] = mo["sy"] = 1 + 0.12 * squash
        mo["sz"] = 1 - 0.16 * squash
        mo["rz"] = 0.10 * math.sin(math.pi * beat / 2)
    elif act == "spin":
        mo["dz"] = hop * 0.6 * s
        mo["rz"] = TAU * u
        mo["sz"] = 1 - 0.06 * squash
    elif act == "walk":
        mo["dx"] = (1.2 if k == 0 else 0.8) * math.sin(TAU * u)
        mo["dz"] = hop * 0.8 * abs(math.sin(TAU * 2 * u))
        mo["ry"] = -0.12 * math.cos(TAU * u)
    elif act == "peek":
        up = 0.5 - 0.5 * math.cos(TAU * u)  # 0 -> 1 -> 0
        mo["dz"] = -0.5 * (1 - up)
        mo["sz"] = 1 - 0.12 * (1 - up)
        mo["rz"] = 0.4 * math.sin(TAU * u)
    elif act == "wave":
        mo["dz"] = hop * 0.25 * s
        mo["rz"] = 0.20 * math.sin(math.pi * beat / 2)
        mo["arm"] = 1.35
    elif act == "sleep":
        breath = 0.5 + 0.5 * math.sin(TAU * u)
        mo["sx"] = mo["sy"] = 1 + 0.035 * breath
        mo["sz"] = 1 - 0.025 * breath
        mo["dz"] = 0.02 * breath
        mo["arm"] = 0.12
        mo["droop"] = 0.38
    elif act == "cheer":
        mo["dz"] = hop * 1.8 * s
        mo["sx"] = mo["sy"] = 1 + 0.10 * squash
        mo["sz"] = 1 - 0.12 * squash
        mo["arm"] = 1.55
    elif act == "chase":
        lag = 0.14 * k
        mo["dx"] = (1.5 if k == 0 else 1.2) * math.sin(TAU * (u - lag))
        mo["dz"] = hop * abs(math.sin(TAU * 2 * (u - lag)))
        mo["ry"] = -0.16 * math.cos(TAU * (u - lag))
    else:  # dance
        mo["dz"] = hop * s
        mo["sx"] = mo["sy"] = 1 + 0.07 * squash
        mo["sz"] = 1 - 0.09 * squash
        mo["ry"] = 0.07 * math.sin(math.pi * beat / 2)
        mo["rz"] = 0.16 * math.sin(math.pi * beat / 2)
    return mo


def animate(rigs, clouds, ballo, flakes, cam, N):
    bf = N / 8.0  # frames per beat (the loop is two bars)
    act = SPEC.get("action", "dance")
    if act not in ACTIONS:
        act = "dance"
    print("ACTION", act)
    for f in range(1, N + 1):
        t = (f - 1)
        for k, rig in enumerate(rigs):
            ph = 0.0 if k == 0 else (0.5 if k == 1 else 0.25)
            b = rig["base"]
            beat = t / bf + ph
            s = abs(math.sin(math.pi * beat))
            u = t / N + (0.0 if k == 0 else 0.1 * k)  # never wrapped, so spins stay smooth
            mo = motion(act, k, beat, u, s)
            root = rig["root"]
            sc = b["scale"]
            root.location = b["loc"] + Vector((mo["dx"] * sc, mo["dy"] * sc, mo["dz"] * sc))
            root.scale = (sc * mo["sx"], sc * mo["sy"], sc * mo["sz"])
            root.rotation_euler = (mo["rx"], mo["ry"], b["rot"] + mo["rz"])
            root.keyframe_insert("location", frame=f)
            root.keyframe_insert("scale", frame=f)
            root.keyframe_insert("rotation_euler", frame=f)
            head = rig.get("head")
            if head is not None:
                nod = 0.08 * math.sin(TAU * beat / 2) + mo["droop"]
                head.rotation_euler = (nod, 0.1 * math.sin(math.pi * beat / 2 + 0.5), rig.get("look", 0.0))
                head.keyframe_insert("rotation_euler", frame=f)
            for sh, sx in rig["arms"]:
                if mo["arm"] is not None:
                    swing = mo["arm"] * (0.75 + 0.25 * math.sin(TAU * beat + (0 if sx > 0 else math.pi)))
                elif rig["kind"] in ("duck", "chick", "parrot", "owl"):
                    swing = 0.25 + 0.45 * abs(math.sin(TAU * beat))
                else:
                    swing = 0.5 + 0.55 * (0.5 + 0.5 * math.sin(math.pi * beat + (0 if sx > 0 else math.pi)))
                sh.rotation_euler = (0, sx * swing, 0)
                sh.keyframe_insert("rotation_euler", frame=f)
            mouth = rig.get("mouth")
            if mouth is not None:
                base = mouth.get("base_scale") or list(mouth.scale)
                mouth["base_scale"] = base
                m = 0.45 + 0.75 * abs(math.sin(TAU * beat))
                mouth.scale = (base[0], base[1], base[2] * m)
                mouth.keyframe_insert("scale", frame=f)
            for ear, sx in rig["ears"]:
                base = ear.get("base_rot") or list(ear.rotation_euler)
                ear["base_rot"] = base
                ear.rotation_euler = (base[0], base[1] + sx * 0.12 * math.sin(TAU * beat), base[2])
                ear.keyframe_insert("rotation_euler", frame=f)
            if rig.get("tail") is not None:
                rig["tail"].rotation_euler = (0, 0, 0.45 * math.sin(TAU * beat))
                rig["tail"].keyframe_insert("rotation_euler", frame=f)
            blink = 1.0
            bt = (t / N + 0.13 * k) % 1.0
            if 0.62 < bt < 0.62 + 2.5 / N:
                blink = 0.12
            for e in rig.get("eyes", []):
                base = e.get("base_scale") or list(e.scale)
                e["base_scale"] = base
                e.scale = (base[0], base[1], base[2] * blink)
                e.keyframe_insert("scale", frame=f)
        for i, c in enumerate(clouds):
            base = c.get("base") or list(c.location)
            c["base"] = base
            c.location = (base[0] + 0.6 * math.sin(TAU * t / N + i), base[1], base[2])
            c.keyframe_insert("location", frame=f)
        for i, g in enumerate(ballo):
            base = g.get("base") or list(g.location)
            g["base"] = base
            g.location = (base[0] + 0.08 * math.sin(TAU * t / N + i), base[1], base[2] + 0.18 * math.sin(TAU * 2 * t / N + i * 2))
            g.rotation_euler = (0, 0.1 * math.sin(TAU * t / N + i), 0)
            g.keyframe_insert("location", frame=f)
            g.keyframe_insert("rotation_euler", frame=f)
        for o, off, base in flakes:
            u = (t / N + off) % 1.0
            o.location = (base.x + 0.15 * math.sin(TAU * (u * 2 + off)), base.y, 6.0 - 6.2 * u)
            o.keyframe_insert("location", frame=f)
        cb = cam.get("base") or list(cam.location)
        cam["base"] = cb
        cam.location = (cb[0] + 0.35 * math.sin(TAU * t / N), cb[1] + 0.25 * math.sin(TAU * t / N + 1.3), cb[2] + 0.12 * math.sin(TAU * t / N))
        cam.keyframe_insert("location", frame=f)
    for o in bpy.data.objects:  # linear, so the loop has no ease-in/out bumps
        ad = o.animation_data
        if ad and ad.action:
            try:
                for fc in ad.action.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = "LINEAR"
            except AttributeError:
                pass


# ------------------------------------------------------------------ render setup
def camera(target, loc, lens):
    cd = bpy.data.cameras.new("cam")
    cd.lens = lens
    cd.clip_end = 300
    cam = link(bpy.data.objects.new("cam", cd))
    cam.location = loc
    tgt = empty("cam_target", target)
    con = cam.constraints.new("TRACK_TO")
    con.target = tgt
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    bpy.context.scene.camera = cam
    return cam, tgt


def setup_render(w, h, fps, frames, engine, samples, transparent=False):
    sc = bpy.context.scene
    names = {"EEVEE": ["BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"], "WORKBENCH": ["BLENDER_WORKBENCH"]}.get(engine, ["CYCLES"])
    for n in names:
        try:
            sc.render.engine = n
            break
        except TypeError:
            continue
    print("ENGINE", sc.render.engine)
    if sc.render.engine == "CYCLES":
        sc.cycles.device = "CPU"
        sc.cycles.samples = samples
        sc.cycles.use_adaptive_sampling = True
        sc.cycles.adaptive_threshold = 0.05
        sc.cycles.max_bounces = 4
        sc.cycles.diffuse_bounces = 2
        sc.cycles.glossy_bounces = 2
        sc.cycles.transparent_max_bounces = 4
        sc.cycles.use_denoising = True
        try:
            sc.cycles.denoiser = "OPENIMAGEDENOISE"
        except Exception:
            pass
        sc.render.use_persistent_data = True
    elif sc.render.engine == "BLENDER_WORKBENCH":
        sh = getattr(getattr(sc, "display", None), "shading", None)
        for attr, val in (("light", "STUDIO"), ("color_type", "MATERIAL"), ("show_shadows", True),
                          ("shadow_intensity", 0.35), ("show_cavity", True), ("cavity_type", "BOTH"),
                          ("show_specular_highlight", True)):
            try:
                setattr(sh, attr, val)
            except Exception:
                pass
        try:
            sh.studio_light = SPEC.get("studio_light", "Default")
        except Exception:
            pass
        try:
            sc.display.render_aa = "8"
        except Exception:
            pass
    else:
        try:
            sc.eevee.taa_render_samples = samples
        except Exception:
            pass
        for attr, val in (("use_gtao", True), ("use_soft_shadows", True), ("use_shadows", True),
                          ("use_raytracing", False), ("shadow_ray_count", 1), ("shadow_step_count", 2),
                          ("shadow_resolution_scale", 0.5)):
            try:
                setattr(sc.eevee, attr, val)
            except Exception:
                pass
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    sc.render.fps = fps
    sc.frame_start, sc.frame_end = 1, frames
    sc.render.film_transparent = transparent
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
    sc.render.image_settings.compression = 15
    try:
        sc.view_settings.view_transform = "Standard"
        sc.view_settings.look = "None"
        sc.view_settings.exposure = float(SPEC.get("exposure", 0.0)) if sc.render.engine == "BLENDER_WORKBENCH" else 0.0
    except Exception:
        pass


# ------------------------------------------------------------------ modes
SHOTS = {  # where the camera sits: (what it looks at, where it is, lens)
    "wide":   ((0, 0.5, 1.15), (0, -7.6, 2.00), 32),
    "medium": ((0, 0.4, 1.25), (0, -6.6, 1.80), 36),
    "low":    ((0, 0.4, 1.35), (0, -6.8, 0.80), 34),
    "high":   ((0, 0.5, 1.00), (0, -7.0, 3.30), 33),
}
SHOTS_V = {
    "wide":   ((0, 0.6, 1.30), (0, -8.4, 2.55), 30),
    "medium": ((0, 0.5, 1.40), (0, -7.2, 2.20), 34),
    "low":    ((0, 0.5, 1.45), (0, -7.4, 1.05), 32),
    "high":   ((0, 0.6, 1.15), (0, -7.8, 3.60), 31),
}


def mode_loop():
    vertical = SPEC.get("vertical", False)
    st, clouds = build_set(SPEC.get("setting", "meadow"), vertical)
    lights(st)
    main = SPEC.get("main", "blob")
    friends = [f for f in SPEC.get("friends", []) if f][:2]
    rigs = [build_character(main, "main", (0, 0, 0), 1.25 if not vertical else 1.15)]
    spots = [(-2.4, 1.6, 0), (2.4, 1.6, 0)] if not vertical else [(-1.3, 2.0, 0), (1.3, 2.0, 0)]
    for i, fk in enumerate(friends):
        friend = build_character(fk, f"friend{i}", spots[i], 0.85 if not vertical else 0.75,
                                 facing=0.35 if spots[i][0] < 0 else -0.35)
        friend["look"] = 0.25 if spots[i][0] < 0 else -0.25  # glance at the star of the scene
        rigs.append(friend)
    ballo = balloons(3, vertical)
    flakes = snowflakes(70) if st.get("snow") else []
    table = SHOTS_V if vertical else SHOTS
    target, where, lens = table.get(SPEC.get("shot", "wide"), table["wide"])
    print("SHOT", SPEC.get("shot", "wide"))
    cam, _ = camera(target, where, lens)
    N = int(SPEC["frames"])
    animate(rigs, clouds, ballo, flakes, cam, N)
    setup_render(SPEC["width"], SPEC["height"], SPEC["fps"], N, SPEC.get("engine", "EEVEE"), SPEC.get("samples", 16))
    sc = bpy.context.scene
    sc.render.filepath = SPEC["out_dir"].rstrip("/") + "/f_####"
    t0 = time.time()
    bpy.ops.render.render(animation=True)
    print(f"RENDERED {N} frames in {time.time() - t0:.1f}s")
    if SPEC.get("portrait"):
        portrait(rigs[0], SPEC["portrait"])


def portrait(rig, path, size=640):
    """Transparent close-up of one character (for thumbnails)."""
    sc = bpy.context.scene
    keep = set()

    def collect(o):
        keep.add(o.name)
        for ch in o.children:
            collect(ch)
    collect(rig["root"])
    for o in bpy.data.objects:
        if o.type in ("MESH",) and o.name not in keep:
            o.hide_render = True
    sc.frame_set(1)
    loc = rig["root"].matrix_world.translation
    s = rig["base"]["scale"]
    cam, tgt = camera((loc.x, loc.y, loc.z + 0.95 * s), (loc.x, loc.y - 4.0 * s, loc.z + 1.25 * s), 40)
    sc.camera = cam
    setup_render(size, size, 24, 1, SPEC.get("engine", "EEVEE"), max(8, SPEC.get("samples", 16)), transparent=True)
    sc.frame_start = sc.frame_end = 1
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    for o in bpy.data.objects:
        o.hide_render = False


def mode_portraits():
    st, _ = build_set("meadow", False)
    lights(st)
    ids = SPEC.get("ids") or ALL_IDS
    rigs = [build_character(k, k, (i * 12.0, -40.0, 0), 1.0) for i, k in enumerate(ids)]
    out = SPEC["out_dir"].rstrip("/")
    for k, rig in zip(ids, rigs):
        portrait(rig, f"{out}/{k}.png", size=SPEC.get("width", 320))
    print("PORTRAITS", len(ids))


bpy.ops.wm.read_factory_settings(use_empty=True)
if SPEC.get("mode") == "portraits":
    mode_portraits()
else:
    mode_loop()
