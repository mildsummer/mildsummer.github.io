/*
 * main.js
 * */

function main(e) {
    var textures = [new THREE.ImageUtils.loadTexture('images/cookie1.jpg', THREE.UVMapping, setRenderer),
        new THREE.ImageUtils.loadTexture('images/cookie2.jpeg', THREE.UVMapping),
        new THREE.ImageUtils.loadTexture('images/cookie3.png', THREE.UVMapping),
        new THREE.ImageUtils.loadTexture('images/choco1.jpg', THREE.UVMapping),
        new THREE.ImageUtils.loadTexture('images/cream.jpg', THREE.UVMapping),
        new THREE.ImageUtils.loadTexture('images/cream2.jpg', THREE.UVMapping)];
    textures.forEach(function(texture, index) {
        textures[index].minFilter = THREE.NearestFilter;
    });

    function setRenderer() {
        //var width = 1500.0;
        //var height = 500.0;
        var width = window.innerWidth;
        var height = window.innerHeight;

        //init render target
        var renderTarget = new THREE.WebGLRenderTarget(width, height, {
            magFilter: THREE.NearestFilter,
            minFilter: THREE.NearestFilter,
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping
        });

        //init scene
        var scene = new THREE.Scene();
        var bufferScene = new THREE.Scene();

        //init camera
        var fov = 60;
        var aspect = width / height;
        var camera = new THREE.PerspectiveCamera(fov, aspect);
        camera.position.set(0, 0, (height / 2) / Math.tan((fov * Math.PI / 180) / 2));
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        scene.add(camera);
        var bufferCamera = camera.clone();
        bufferScene.add(bufferCamera);

        //init renderer
        var renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(0xffffff, 0);
        document.body.appendChild(renderer.domElement);

        //init controls
        var controls = new THREE.TrackballControls(bufferCamera);

        // use "this." to create global object
        var uniforms =
        {
            buffer: { type: "t", value: renderTarget },
            texture1: { type: "t", value: textures[0] },
            texture2: { type: "t", value: textures[1] },
            texture3: { type: "t", value: textures[2] },
            texture4: { type: "t", value: textures[3] },
            texture5: { type: "t", value: textures[4] },
            texture6: { type: "t", value: textures[5] },
            size: { type: "v2", value: new THREE.Vector2(width, height) }
        };

        var planeGeometry = new THREE.PlaneGeometry(width, height);

        var planeMaterial = new THREE.ShaderMaterial({
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent,
            uniforms: uniforms
        });

        //var planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, map: renderTarget });

        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        //plane.scale.set(width, height, 1);
        scene.add(plane);
        console.log(planeGeometry.vertices);

        var torus = new THREE.Mesh(new THREE.TorusGeometry( 300, 70, 16, 100 ), new THREE.MeshBasicMaterial( { color: 0xffff00 } ));
        bufferScene.add(torus);

        update();
        window.addEventListener("resize", resize);

        function update() {
            torus.rotation.y += 0.005;
            controls.update();
            renderer.render(bufferScene, bufferCamera, renderTarget);
            renderer.render(scene, camera);
            requestAnimationFrame(update);
        }

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            renderer.setSize(width, height);
            renderTarget.setSize(width, height);
            uniforms.size.value.set(width, height);
            console.log(uniforms.size.value);
            camera.aspect = bufferCamera.aspect = width / height;
            camera.updateProjectionMatrix();
            bufferCamera.updateProjectionMatrix();
        }

    }
}

window.addEventListener('DOMContentLoaded', main, false);