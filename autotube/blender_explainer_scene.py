"""Render stylized, animated 3D mechanism scenes with Blender."""
import bpy
import json
import mathimport sys
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
    bevel = obj.modifiers.new("Soft machined edges", "BEVEL")
    bevel.width = 0.07
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
    if axis == "X": o.rotation_euler[1] = math.pi / 2
    if axis == "Y": o.rotation_euler[0] = math.pi / 2
    return finish(o, mat)


def sphere(name, loc, radius, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=radius, location=loc)
    return finish(bpy.context.object, mat)


def torus(name, loc, major, minor, mat, axis="Z"):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=48, minor_segments=12, location=loc)
    o = bpy.context.object
    if axis == "X": o.rotation_euler[1] = math.pi / 2
    if axis == "Y": o.rotation_euler[0] = math.pi / 2
    return finish(o, mat)


def rod(name, a, b, radius, mat):
    mid = tuple((x+y)/2 for x,y in zip(a,b))
    d = math.dist(a,b)
    o = cyl(name, mid, radius, d, mat)
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = (Vector(b)-Vector(a)).to_track_quat("Z","Y")
    return o


def track(obj, point):
    obj.rotation_euler = (Vector(point)-obj.location).to_track_quat("-Z","Y").to_euler()


def gear(name, x, y, radius, mat):
    # A readable toothed wheel built from a beveled hub and eight rectangular teeth.
    hub = cyl(name, (x,y,1.45), radius*0.76, 0.30, mat)
    teeth=[]
    for i in range(10):
        a = math.tau*i/10
        t=cube(name+" tooth", (x+math.cos(a)*radius,y+math.sin(a)*radius,1.45), (radius*0.42,0.20,0.32),mat)
        t.rotation_euler[2]=a
        teeth.append(t)
    torus(name+" bearing",(x,y,1.64),radius*0.40,0.045,mat)
    return hub,teeth


def model(kind, M):
    navy, steel, teal, gold, coral, white, glass = (M[k] for k in ("navy","steel","teal","gold","coral","white","glass"))
    anim=[]
    if kind == "reactor":
        cube("reactor base",(0,0,0.65),(3.6,2.2,0.45),steel)
        cyl("steel pressure vessel",(0,0,2.15),0.95,2.8,steel)
        torus("upper flange",(0,0,3.55),0.97,0.12,gold)
        cyl("core",(0,0,2.2),0.58,1.55,navy)
        for i in range(8):
            a=math.tau*i/8
            rod("fuel rod",(math.cos(a)*0.36,math.sin(a)*0.36,1.58),(math.cos(a)*0.36,math.sin(a)*0.36,2.82),0.045,teal)
        for x in (-1.35,1.35):
            cyl("coolant pipe",(x,0,1.85),0.14,2.4,teal,"Z")
        for i in range(6):
            s=sphere("heat particle",(0,0,2.1+i*0.18),0.065,gold); anim.append(lambda p,o=s,i=i: setattr(o,"location",(math.sin(p+i)*0.35, math.cos(p+i)*0.28,1.8+(p/math.tau%1)*1.35)))
    elif kind == "battery":
        cube("battery body",(0,0,1.25),(3.4,1.9,2.4),steel)
        for x in (-0.78,0.78):
            cube("cell",(x,0,1.35),(1.2,1.35,1.9),navy)
            for z in (0.8,1.25,1.7,2.15): cube("cell layer",(x,0,z),(0.95,1.42,0.10),teal if z<1.5 else gold)
        for x,m in ((-1.55,coral),(1.55,teal)):
            cube("terminal",(x,0,2.62),(0.48,0.5,0.25),m)
        for i in range(4):
            s=sphere("charge",(-1.25+i*0.22,0,2.95),0.08,gold); anim.append(lambda p,o=s,i=i: setattr(o,"location",(-1.25+((p/math.tau+i*0.18)%1)*2.5,0,2.95)))
    elif kind == "chip":
        cube("silicon package",(0,0,1.2),(3.2,2.6,0.62),navy)
        cube("silicon die",(0,0,1.58),(1.85,1.55,0.25),teal)
        for x in (-1.35,-0.9,-0.45,0,0.45,0.9,1.35):
            for y in (-1.15,1.15): cube("pin",(x,y,0.96),(0.12,0.55,0.12),gold)
        for y in (-0.9,-0.45,0,0.45,0.9):
            for x in (-1.0,1.0): cube("circuit trace",(x,y,1.73),(0.28,0.09,0.05),white)
        for i in range(5):
            s=sphere("data pulse",(-0.9,-0.7+i*0.35,1.88),0.09,gold); anim.append(lambda p,o=s,i=i: setattr(o,"location",(-0.9+((p/math.tau+i*.2)%1)*1.8,o.location.y,1.88)))
    elif kind == "orbit":
        sun=sphere("star",(0,0,1.5),0.58,gold)
        for r,m in ((1.45,teal),(2.3,steel)):
            torus("orbital path",(0,0,1.5),r,0.025,m)
            planet=sphere("planet",(r,0,1.5),0.22 if r<2 else 0.30,teal if r<2 else coral)
            anim.append(lambda p,o=planet,r=r: setattr(o,"location",(r*math.cos(p),r*math.sin(p)*0.72,1.5)))
    elif kind in ("elevator","mechanism"):
        for x in (-1.35,1.35): cyl("lift column",(x,0,1.8),0.09,3.6,steel)
        cube("lift platform",(0,0,1.2),(2.6,1.75,0.22),teal)
        cube("lift cabin",(0,0,1.92),(2.0,1.45,1.15),glass)
        for x in (-0.76,0.76):
            torus("pulley",(x,0,3.7),0.36,0.09,gold,"X")
            cyl("pulley axle",(x,0,3.7),0.10,0.35,steel,"X")
        rope=rod("lift cable",(0.0,0,1.0),(0,0,3.65),0.035,white)
        # Vertical travel is intentionally small so the model stays within camera bounds.
        anim.append(lambda p,o=next(o for o in bpy.context.scene.objects if o.name=="lift cabin"): setattr(o,"location",(0,0,1.92+0.35*math.sin(p))))
    elif kind in ("engine","motor"):
        cyl("motor casing",(0,0,1.5),0.9,2.7,steel,"X")
        for x in (-0.9,-0.45,0,0.45,0.9): torus("cooling rib",(x,0,1.5),0.88,0.055,navy,"X")
        shaft=cyl("drive shaft",(1.65,0,1.5),0.20,1.1,gold,"X")
        rotor=cyl("rotor",(0,0,1.5),0.48,1.4,teal,"X")
        anim.append(lambda p,o=rotor: setattr(o,"rotation_euler",(p,0,0)))
        for i in range(8):
            a=math.tau*i/8
            cube("stator winding",(-0.15,math.cos(a)*0.68,1.5+math.sin(a)*0.68),(1.8,0.14,0.14),coral)
    elif kind in ("solar","panel"):
        for x in (-1.1,1.1): rod("panel support",(x,0,0.25),(x,0,1.35),0.08,steel)
        cube("solar panel",(0,0,1.45),(3.1,2.0,0.18),navy)
        for x in (-1.0,-0.5,0,0.5,1.0): cube("photovoltaic strip",(x,0,1.56),(0.035,1.8,0.035),teal)
        for y in (-0.5,0,0.5): cube("cell divider",(0,y,1.56),(2.95,0.035,0.035),teal)
        for i in range(4):
            s=sphere("photon",(-1.2,-0.3+i*.2,2.65),0.07,gold); anim.append(lambda p,o=s,i=i: setattr(o,"location",(1.2-((p/math.tau+i*.2)%1)*2.4,o.location.y,2.65)))
    elif kind in ("data_center","network","sensor","fiber","wave","payment","pipeline"):
        count=4 if kind=="data_center" else 3
        nodes=[]
        for i in range(count):
            x=(i-(count-1)/2)*1.35
            cube("server chassis",(x,0,1.25),(0.95,1.05,2.25),steel)
            for z in (0.52,0.95,1.38,1.81,2.24):
                cube("server drawer",(x,-0.56,z),(0.75,0.08,0.30),navy)
                sphere("status light",(x+0.25,-0.62,z),0.055,teal)
            nodes.append((x,-0.65,2.5))
        for a,b in zip(nodes,nodes[1:]): rod("fiber link",a,b,0.045,gold)
        for i in range(5):
            s=sphere("network packet",(-2,-0.65,2.55),0.09,coral); anim.append(lambda p,o=s,i=i: setattr(o,"location",(-2+((p/math.tau+i*.2)%1)*4,-0.65,2.55)))
    else:
        left,teeth=gear("drive gear",-0.72,0,0.8,teal)
        right,teeth2=gear("output gear",0.72,0,0.8,gold)
        anim.append(lambda p,o=left,t=teeth: (setattr(o,"rotation_euler",(0,0,p)),[setattr(q,"rotation_euler",(0,0,p)) for q in t]))
        anim.append(lambda p,o=right,t=teeth2: (setattr(o,"rotation_euler",(0,0,-p)),[setattr(q,"rotation_euler",(0,0,-p)) for q in t]))
    return anim


def main():
    args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    if not args: raise SystemExit("expected scene spec JSON")
    spec=json.loads(Path(args[0]).read_text(encoding="utf-8")); out=Path(spec["out_dir"]); out.mkdir(parents=True,exist_ok=True)
    bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
    M={"navy":material("Midnight",(0.018,0.055,0.13)),"steel":material("Satin alloy",(0.20,0.34,0.52),0.55),"teal":material("Signal teal",(0.035,0.72,0.75),0.25),"gold":material("Warm brass",(1.0,0.48,0.12),0.45),"coral":material("Alert",(0.90,0.15,0.12)),"white":material("Ceramic",(0.8,0.9,1.0)),"glass":material("Glass",(0.035,0.35,0.48),0.2)}
    kind=str(spec.get("model","mechanism")).lower(); updates=model(kind,M)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,0)); bpy.context.object.data.materials.append(M["navy"])
    bpy.ops.object.camera_add(location=(6,-10,7)); cam=bpy.context.object; track(cam,(0,0,1.55)); cam.data.type="ORTHO"; cam.data.ortho_scale=8.4; bpy.context.scene.camera=cam
    scene=bpy.context.scene; scene.render.engine="BLENDER_WORKBENCH"; scene.render.resolution_x=int(spec.get("width",640)); scene.render.resolution_y=int(spec.get("height",360)); scene.render.resolution_percentage=100; scene.render.image_settings.file_format="PNG"; scene.render.film_transparent=False
    scene.render.fps=int(spec.get("fps",12)); scene.world.color=(0.018,0.035,0.085); scene.display.shading.light="STUDIO"; scene.display.shading.color_type="MATERIAL"; scene.display.shading.show_shadows=True; scene.display.shading.show_cavity=True; scene.display.shading.cavity_type="BOTH"; scene.display.shading.curvature_ridge_factor=1.4; scene.display.shading.curvature_valley_factor=1.1
    frames=max(2,int(spec.get("frames",48)))
    for i in range(frames):
        phase=math.tau*i/(frames-1)
        for update in updates: update(phase)
        scene.frame_set(i+1); scene.render.filepath=str(out/f"f_{i+1:04d}.png"); bpy.ops.render.render(write_still=True)

if __name__=="__main__": main()
