var MorphingSlider = MorphingSlider || {};

MorphingSlider.WebGLSlider = function (options) {

    this.direction = (options && typeof(options.direction) === 'boolean') ? options.direction : true;

    this.easing = (options && typeof(options.easing) === 'string') ? options.easing : 'linear';

    this.duration = (options && typeof(options.duration) === 'number') ? options.duration : 500;

    this.interval = (options && typeof(options.interval) === 'number') ? options.interval : 500;

    this.index = 0;//the index of the displayed image

    this.width = this.height = 0;

    this.isAnimating = false;

    this._textures = [];

    this._vectors = [];

    this._threeObjects = {};

    this._threeObjects.scene = new THREE.Scene();

    this._threeObjects.camera = new THREE.PerspectiveCamera(60, 1);
    this._threeObjects.scene.add(this._threeObjects.camera);

    this._threeObjects.renderer = new THREE.WebGLRenderer();

    var uniforms = {
        baseTexture: {type: "t", value: null},
        targetTexture: {type: "t", value: null},
        mixAmount: {type: "f", value: 0.0}
    };

    var attributes = {
        basePosition: {type: 'v2', value: []},
        targetPosition: {type: 'v2', value: []}
    };

    var geometry = new THREE.Geometry();

    var mat = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        uniforms: uniforms,
        attributes: attributes
    });

    this._threeObjects.mesh = new THREE.Mesh(geometry, mat);
    this._threeObjects.scene.add(this._threeObjects.mesh);

    return this;
};

MorphingSlider.WebGLSlider.prototype.setFaces = function (faces) {
    this.faces = faces;
    return this;
};

MorphingSlider.WebGLSlider.prototype.addSlide = function (src, data, callback) {
    if (typeof(src) !== "string") {
        return this;
    }

    var self = this;
    var texture = new THREE.ImageUtils.loadTexture(src, THREE.UVMapping, function () {
        self.width = self.width > texture.image.width ? self.width : texture.image.width;
        self.height = self.height > texture.image.height ? self.height : texture.image.height;
        self._threeObjects.renderer.setSize(self.width, self.height);

        if (typeof(callback) === "function") {
            callback.call(self);
        }
    });

    if (this._textures.length < 1) {
        data.forEach(function (point) {
            self._threeObjects.mesh.geometry.vertices.push(new THREE.Vector3(Math.round((point[0] * 2 - 1) * 100) / 100, Math.round(((1 - point[1]) * 2 - 1) * 100) / 100, 1.0));
        });
        this.faces.forEach(function (face) {
            self._threeObjects.mesh.geometry.faces.push(new THREE.Face3(face[0], face[1], face[2]));
        });
        this._threeObjects.mesh.geometry.computeBoundingSphere();
        this._threeObjects.mesh.geometry.computeFaceNormals();
        document.body.appendChild(self._threeObjects.renderer.domElement);
    }
    texture.minFilter = THREE.LinearFilter;
    this._textures.push(texture);

    var vectors = [];
    data.forEach(function (point) {
        vectors.push(new THREE.Vector2(Math.round((point[0] * 2 - 1) * 100) / 100, Math.round(((1 - point[1]) * 2 - 1) * 100) / 100));
    });
    this._vectors.push(vectors);

    return this;
};

MorphingSlider.WebGLSlider.prototype.morph = function (callback) { //direction : trueで次、falseで前へ
    if (this.isAnimating || this._textures.length < 2) { //アニメーションの重複を防ぐ
        return this;
    }

    var self = this;

    var startTime = new Date();

    var afterIndex = (this.index + (this.direction * 2 - 1) + this._textures.length) % this._textures.length;

    var uniforms = this._threeObjects.mesh.material.uniforms;
    var attributes = this._threeObjects.mesh.material.attributes;

    uniforms.baseTexture.value = this._textures[this.index]; //いまのMorphingImage
    uniforms.targetTexture.value = this._textures[afterIndex]; //モーフィング後のMorphingImage

    this._vectors[this.index].forEach(function (v, i) {
        attributes.basePosition.value[i] = self._vectors[self.index][i].clone();
    });

    this._vectors[afterIndex].forEach(function (v, i) {
        attributes.targetPosition.value[i] = self._vectors[afterIndex][i].clone();
    });

    attributes.basePosition.needsUpdate = true;
    attributes.targetPosition.needsUpdate = true;

    var update = function () {
        var t = new Date() - startTime;
        if (t > self.duration) {
            self._threeObjects.mesh.material.uniforms.mixAmount.value = 1.0;
            self._threeObjects.renderer.render(self._threeObjects.scene, self._threeObjects.camera);
            self.index = afterIndex;
            self.isAnimating = false;
            if (typeof(callback) === "function") {
                callback.call(self);
            }
        } else {
            var e = self.ease[self.easing](t / self.duration);
            self._threeObjects.mesh.material.uniforms.mixAmount.value = e;
            self._threeObjects.renderer.render(self._threeObjects.scene, self._threeObjects.camera);
            window.requestAnimationFrame(update);
        }
    };

    var af = window.requestAnimationFrame(update);

    this.isAnimating = true;

    return this;
};

MorphingSlider.WebGLSlider.prototype.play = function (callback) { //続けてモーフィング direction: true=>前へ false=>後へ, interval: モーフィング間隔
    var self = this;
    this.timer = setInterval(function () {
        self.morph.call(self, ((typeof(callback) === 'function') ? [callback] : null));
    }, this.interval + this.duration);

    return this;
};

MorphingSlider.WebGLSlider.prototype.stop = function () {
    clearInterval(this.timer);
    return this;
};

MorphingSlider.prototype.ease = {
    // no easing, no acceleration
    linear: function (t) {
        return t
    },
    // accelerating from zero velocity
    easeInQuad: function (t) {
        return t * t
    },
    // decelerating to zero velocity
    easeOutQuad: function (t) {
        return t * (2 - t)
    },
    // acceleration until halfway, then deceleration
    easeInOutQuad: function (t) {
        return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    },
    // accelerating from zero velocity
    easeInCubic: function (t) {
        return t * t * t
    },
    // decelerating to zero velocity
    easeOutCubic: function (t) {
        return (--t) * t * t + 1
    },
    // acceleration until halfway, then deceleration
    easeInOutCubic: function (t) {
        return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    },
    // accelerating from zero velocity
    easeInQuart: function (t) {
        return t * t * t * t
    },
    // decelerating to zero velocity
    easeOutQuart: function (t) {
        return 1 - (--t) * t * t * t
    },
    // acceleration until halfway, then deceleration
    easeInOutQuart: function (t) {
        return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
    },
    // accelerating from zero velocity
    easeInQuint: function (t) {
        return t * t * t * t * t
    },
    // decelerating to zero velocity
    easeOutQuint: function (t) {
        return 1 + (--t) * t * t * t * t
    },
    // acceleration until halfway, then deceleration
    easeInOutQuint: function (t) {
        return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
    }
};
