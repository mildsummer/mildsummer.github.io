/*
 * main.js
 * */

function main(e) {
    var texture1 = new THREE.ImageUtils.loadTexture('shika.jpg', THREE.UVMapping, setRenderer);
    var texture2 = new THREE.ImageUtils.loadTexture('ushi.jpg');

    function setRenderer() {
        var width = texture1.image.width;
        var height = texture1.image.height;

        var scene = new THREE.Scene();

        var fov = 60;
        var aspect = width / height;
        var camera = new THREE.PerspectiveCamera(fov, aspect);
        camera.position.set(0, 0, (height / 2) / Math.tan((fov * Math.PI / 180) / 2));
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        scene.add(camera);

        // use "this." to create global object
        var uniforms =
        {
            baseTexture: { type: "t", value: texture1 },
            targetTexture: { type: "t", value: texture2 },
            mixAmount: { type: "f", value: 0.0 },
            width: { type: "f", value: width },
            height: { type: "f", value: height }
        };

        var geometry = new THREE.PlaneGeometry(width, height, 20, 20);
        var attributes = {
            basePosition: { type: 'v3', value: [] },
            targetPosition: { type: 'v3', value: [] }
        };
        geometry.vertices.forEach(function(v, i) {
            var v = geometry.vertices[i];
            v.x += Math.random() * 10;
            v.y += Math.random() * 10;
            attributes.targetPosition.value[i] = new THREE.Vector3(v.x + Math.random() * 50, v.y + Math.random() * 50, 1.0);
        });
        attributes.basePosition.value = geometry.vertices;
        console.log(attributes.targetPosition.value);

        var mat = new THREE.ShaderMaterial({
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent,
            uniforms: uniforms,
            attributes: attributes
        });

        var mesh = new THREE.Mesh(geometry, mat);
        scene.add(mesh);
        var renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        console.log(renderer);
        document.body.appendChild(renderer.domElement);

        var clock = new THREE.Clock();

        var t = 0;
        var total = 60;
        var d = 1;
        (function loop() {
            clock.getDelta(); // update clock

            uniforms.mixAmount.value = t / total;
            t += d;
            if(t > total) {
                d = -1;
            } else if(t < 0) {
                d = 1;
            }
            renderer.render(scene, camera);
            requestAnimationFrame(loop);
        })();
    }

}

window.addEventListener('DOMContentLoaded', main, false);