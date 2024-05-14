import * as THREE from 'three';
import GUI from 'lil-gui'
import vertexShader from '../shaders/vertex.glsl'
import fragmentShader from '../shaders/fragment.glsl'
import AbstractImage from '/abs.png'
import Stats from 'stats.js'
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';


export default class threeJS {
	constructor(options) {
		this.gsap = gsap.registerPlugin(ScrollTrigger);
		this.previousTime = 0;
		this.time = 0;
		this.container = options.dom;

		this.stats = new Stats()
		this.stats.showPanel(0)
		this.container.appendChild(this.stats.dom);

		this.debugObject ={
			depthColor: '#a30000',
			surfaceColor :'#ffe770'
		}

		this.params = {
			exposure: 0.1,
			bloomStrength: 0.1,
			bloomThreshold: 0,
			bloomRadius: 0
		  };
		



		this.scene = new THREE.Scene();
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;

		this.camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 0.01, 1000);
		this.camera.position.set(2.6, 1.4, 2.9);
		

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			// alpha:true
		});
		this.renderer.setSize(this.width, this.height);
		this.container.appendChild(this.renderer.domElement);

		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		this.clock = new THREE.Clock();

		this.dracoloader = new DRACOLoader();
		this.dracoloader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.6;

		this.gltf = new GLTFLoader();
		this.gltf.setDRACOLoader(this.dracoloader);
		this.isPlaying = true;

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.update();
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.1;


		//GUi
		this.gui = new GUI({ width:'320px'});

		this.container.appendChild(this.gui.domElement);


		this.settings();
		this.initiPost();
		this.addObjects();
		this.render();
		this.resize();
		this.setupResize();
	}

	addObjects() {
		// this.geometry = new THREE.SphereGeometry(1,1024,1024);
		this.geometry = new THREE.PlaneGeometry(5,5,1024,1024);
		// this.geometry = new THREE.IcosahedronGeometry(1,150);


		this.material = new THREE.ShaderMaterial({
			uniforms:{
				uTime:{value:0},
				uBigWavesSpeed:{value:0.124},

				uResolution:{value:0},
				uBigWavesElevation: {value: 0.13},
				uBigWavesFrequency: {value: new THREE.Vector2(4,1.5)},

				uDepthColor :{value : new THREE.Color (this.debugObject.depthColor)},
				uSurfaceColor :{value : new THREE.Color (this.debugObject.surfaceColor)},
				uColorMultiplier:{value: 8.59},
				uColorOffset:{value:0.9},
				uTexture:{value: new THREE.TextureLoader().load(AbstractImage)}
			},
			// wireframe:true,
			vertexShader:vertexShader,
			fragmentShader:fragmentShader,
			side:THREE.DoubleSide
		});
		
		this.cube = new THREE.Mesh(this.geometry, this.material);
		this.scene.add(this.cube);
		this.cube.rotation.x = -Math.PI  * 0.5;
		this.cube.position.set(0,0.2,0);



		this.gui.add(this.material.uniforms.uBigWavesElevation, 'value').min(0).max(1).step(0.001).name('uBigWavesElevation')
		
		this.gui.add(this.material.uniforms.uBigWavesFrequency.value ,'x').min(0).max(10).step(0.001).name('uBigWavesFrequency-X')

		this.gui.add(this.material.uniforms.uBigWavesFrequency.value ,'y').min(0).max(10).step(0.001).name('uBigWavesFrequency-Y')

		this.gui.add(this.material.uniforms.uBigWavesSpeed,'value').min(0.01).max(0.3).step(0.001).name('Speed')

		this.gui.addColor(this.debugObject,'depthColor').onChange(()=>{this.material.uniforms.uDepthColor.value.set(this.debugObject.depthColor)}).name('depthColour')


		this.gui.addColor(this.debugObject,'surfaceColor').onChange(()=>{this.material.uniforms.uSurfaceColor.value.set(this.debugObject.surfaceColor)}).name('surfaceColor')

		this.gui.add(this.material.uniforms.uColorOffset,'value').min(0).max(1).step(0.1).name('Color Offset')

		this.gui.add(this.material.uniforms.uColorMultiplier,'value').min(1).max(10).step(0.01).name('Multipler')

	}

	settings() {
		let that = this;
		this.settings = {
			exposure: 1,
			bloomThreshold: 0.1,
			bloomStrength: 0.2,
			bloomRadius: 1.2
		};
		
	}

	setupResize() {
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		window.addEventListener('resize', this.resize.bind(this));
	}
	initiPost() {
		this.renderTarget = new THREE.WebGLRenderTarget( this.width, this.height, this.settings );
		
		this.renderScene = new RenderPass(this.scene, this.camera);
		this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
		this.bloomPass.threshold = this.settings.bloomThreshold;
		this.bloomPass.strength = this.settings.bloomStrength;
		this.bloomPass.radius = this.settings.bloomRadius;


		this.composer = new EffectComposer(this.renderer, this.renderTarget);
		this.composer.addPass(this.renderScene);
		this.composer.addPass(this.bloomPass);

	}

	resize() {
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer.setSize(this.width, this.height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.composer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
	}
	stop() {
		this.isPlaying = false;
	}
	play() {
		if (!this.isPlaying) {
			this.render();
			this.isPlaying = true;
		}
	}

	render() 
	{
		this.elapsedTime = this.clock.getElapsedTime();
		this.deltaTime = this.elapsedTime - this.previousTime;
		this.previousTime = this.elapsedTime;
		this.time = this.material.uniforms.uBigWavesSpeed.value;

		requestAnimationFrame(this.render.bind(this));
		this.renderer.render(this.scene, this.camera);
		this.renderer.clearDepth();

		if (!this.isPlaying) return;
		this.controls.update();

		this.stats.update()

		
		this.material.uniforms.uTime.value += this.time;

		// console.log(this.camera.position)
		//for Bloom Enable this
		// this.composer.render(this.scene, this.camera);
		
	}
}
