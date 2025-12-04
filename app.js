// Главный объект приложения (исправленная версия)
const GraphicsLab = {
    // Сцены и камеры
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    
    // Объекты
    letter: null,
    projections: { xy: null, xz: null, yz: null },
    
    // Состояние
    currentScene: 'main',
    wireframeMode: false,
    showProjections: true,
    
    // Матрица преобразования
    transformationMatrix: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ],
    
    // Инициализация
    init: function() {
        console.log('Инициализация лабораторных работ...');
        
        if (!this.checkThreeJS()) {
            return;
        }
        
        try {
            // Создаем сцену и рендерер
            this.initRenderer();
            
            // Инициализируем 3D сцену
            this.init3DScene();
            
            // Создаем модель буквы "Ю" (упрощенная)
            this.createSimpleLetter();
            
            // Настраиваем элементы управления
            this.setupControls();
            
            // Обновляем матрицу
            this.updateMatrixDisplay();
            
            // Запускаем анимацию
            this.animate();
            
            // Статус
            document.getElementById('threeVersion').textContent = THREE.REVISION;
            console.log('Лабораторные работы инициализированы');
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            document.getElementById('scene3d').innerHTML = `
                <div style="padding: 20px; color: white;">
                    <h3 style="color: #e74c3c;">Ошибка: ${error.message}</h3>
                    <p>Используется Three.js версии ${THREE.REVISION}</p>
                </div>
            `;
        }
    },
    
    // Проверка Three.js
    checkThreeJS: function() {
        if (typeof THREE === 'undefined') {
            document.body.innerHTML = `
                <div style="padding: 50px; text-align: center; color: white;">
                    <h1 style="color: red;">Three.js не загружен!</h1>
                    <p>Убедитесь что файл three.min.js в папке js/</p>
                </div>
            `;
            return false;
        }
        return true;
    },
    
    // Инициализация рендерера
    initRenderer: function() {
        const container = document.getElementById('scene3d');
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        
        container.appendChild(this.renderer.domElement);
    },
    
    // Инициализация 3D сцены
    init3DScene: function() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        // Камера для основной сцены
        const container = document.getElementById('scene3d');
        this.camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(8, 8, 12);
        
        // OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 30;
        
        // Освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(15, 20, 10);
        this.scene.add(directionalLight);
        
        // Сетка и оси
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        gridHelper.position.y = -0.01;
        this.scene.add(gridHelper);
        
        const axesHelper = new THREE.AxesHelper(10);
        this.scene.add(axesHelper);
    },
    
    // Создание упрощенной модели буквы "Ю"
    createSimpleLetter: function() {
        // Удаляем старый объект
        if (this.letter) {
            this.scene.remove(this.letter);
        }
        
        this.letter = new THREE.Group();
        
        // Получаем параметры
        const color = document.getElementById('color').value;
        const wireframeColor = document.getElementById('wireframeColor').value;
        const scale = parseFloat(document.getElementById('scale').value);
        
        // Создаем материал
        const material = new THREE.MeshBasicMaterial({ 
            color: document.getElementById('showWireframe').checked 
                ? wireframeColor 
                : color,
            wireframe: document.getElementById('showWireframe').checked
        });
        
        // 1. Вертикальная линия слева
        const leftLineGeometry = new THREE.BoxGeometry(
            0.4 * scale,    // толщина
            4 * scale,      // высота (диаметр круга)
            0.4 * scale     // глубина
        );
        const leftLine = new THREE.Mesh(leftLineGeometry, material);
        leftLine.position.set(-3.0 * scale, 2 * scale, 0);
        this.letter.add(leftLine);
        
        // 2. Горизонтальная соединительная линия
        const connectorGeometry = new THREE.BoxGeometry(
            3.0 * scale,    // длина
            0.4 * scale,    // толщина
            0.4 * scale     // глубина
        );
        const connector = new THREE.Mesh(connectorGeometry, material);
        connector.position.set(-1.5 * scale, 2 * scale, 0);
        this.letter.add(connector);
        
        // 3. Круг справа
        const circleGeometry = new THREE.TorusGeometry(
            1.5 * scale,    // радиус
            0.4 * scale,    // толщина
            16,             // радиальные сегменты
            32              // трубные сегменты
        );
        const circle = new THREE.Mesh(circleGeometry, material);
        circle.position.set(1.5 * scale, 2 * scale, 0);
        this.letter.add(circle);
        
        // Применяем текущие преобразования
        this.applyCurrentTransformations();
        
        // Добавляем на сцену
        this.scene.add(this.letter);
        
        // Обновляем информацию
        this.updateModelInfo();
    },
    
    // Применение текущих преобразований к объекту
    applyCurrentTransformations: function() {
        if (!this.letter) return;
        
        // Сбрасываем преобразования
        this.letter.scale.set(1, 1, 1);
        this.letter.position.set(0, 0, 0);
        this.letter.rotation.set(0, 0, 0);
        
        // Применяем масштаб
        const scale = parseFloat(document.getElementById('scale').value);
        this.letter.scale.set(scale, scale, scale);
        
        // Применяем перенос
        const tx = parseFloat(document.getElementById('translateX').value);
        const ty = parseFloat(document.getElementById('translateY').value);
        const tz = parseFloat(document.getElementById('translateZ').value);
        this.letter.position.set(tx, ty, tz);
        
        // Применяем вращение
        const angle = parseFloat(document.getElementById('rotateAngle').value) * Math.PI / 180;
        const axis = document.getElementById('rotateAxis').value;
        
        if (axis === 'x') {
            this.letter.rotation.x = angle;
        } else if (axis === 'y') {
            this.letter.rotation.y = angle;
        } else if (axis === 'z') {
            this.letter.rotation.z = angle;
        } else if (axis === 'custom') {
            const ax = parseFloat(document.getElementById('axisX').value);
            const ay = parseFloat(document.getElementById('axisY').value);
            const az = parseFloat(document.getElementById('axisZ').value);
            
            // Для упрощения вращаем вокруг оси Y если произвольная ось
            this.letter.rotation.y = angle;
        }
        
        // Обновляем матрицу преобразования
        this.updateTransformationMatrix();
    },
    
    // Обновление матрицы преобразования (упрощенное)
    updateTransformationMatrix: function() {
        // Получаем текущие значения
        const scale = parseFloat(document.getElementById('scale').value);
        const tx = parseFloat(document.getElementById('translateX').value);
        const ty = parseFloat(document.getElementById('translateY').value);
        const tz = parseFloat(document.getElementById('translateZ').value);
        const angle = parseFloat(document.getElementById('rotateAngle').value) * Math.PI / 180;
        const axis = document.getElementById('rotateAxis').value;
        
        // Создаем матрицу масштабирования
        const scaleMatrix = [
            [scale, 0, 0, 0],
            [0, scale, 0, 0],
            [0, 0, scale, 0],
            [0, 0, 0, 1]
        ];
        
        // Создаем матрицу вращения (вокруг оси Z для простоты)
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        let rotateMatrix;
        if (axis === 'x') {
            rotateMatrix = [
                [1, 0, 0, 0],
                [0, cos, -sin, 0],
                [0, sin, cos, 0],
                [0, 0, 0, 1]
            ];
        } else if (axis === 'y') {
            rotateMatrix = [
                [cos, 0, sin, 0],
                [0, 1, 0, 0],
                [-sin, 0, cos, 0],
                [0, 0, 0, 1]
            ];
        } else { // ось Z или произвольная
            rotateMatrix = [
                [cos, -sin, 0, 0],
                [sin, cos, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ];
        }
        
        // Создаем матрицу переноса
        const translateMatrix = [
            [1, 0, 0, tx],
            [0, 1, 0, ty],
            [0, 0, 1, tz],
            [0, 0, 0, 1]
        ];
        
        // Умножаем матрицы: перенос * вращение * масштаб
        let tempMatrix = this.multiplyMatrices(rotateMatrix, scaleMatrix);
        this.transformationMatrix = this.multiplyMatrices(translateMatrix, tempMatrix);
        
        // Обновляем отображение
        this.updateMatrixDisplay();
    },
    
    // Умножение матриц 4x4
    multiplyMatrices: function(a, b) {
        const result = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        
        return result;
    },
    
    // Обновление отображения матрицы
    updateMatrixDisplay: function() {
        const matrixOutput = document.getElementById('matrixOutput');
        const matrixDisplay = document.getElementById('matrixDisplay');
        
        let output = '';
        let display = '';
        
        for (let i = 0; i < 4; i++) {
            output += '[ ';
            display += '[ ';
            for (let j = 0; j < 4; j++) {
                const val = this.transformationMatrix[i][j];
                output += val.toFixed(2) + ' ';
                display += val.toFixed(3) + ' ';
            }
            output += ']\n';
            display += ']\n';
        }
        
        matrixOutput.textContent = output;
        matrixDisplay.textContent = display;
    },
    
    // Настройка элементов управления
    setupControls: function() {
        // Масштаб
        document.getElementById('scale').addEventListener('input', (e) => {
            document.getElementById('scaleValue').textContent = e.target.value;
            this.applyCurrentTransformations();
        });
        
        // Цвета
        document.getElementById('color').addEventListener('input', () => {
            this.createSimpleLetter();
        });
        
        document.getElementById('wireframeColor').addEventListener('input', () => {
            this.createSimpleLetter();
        });
        
        // Каркас
        document.getElementById('showWireframe').addEventListener('change', (e) => {
            this.createSimpleLetter();
        });
        
        // Перенос
        ['translateX', 'translateY', 'translateZ'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                document.getElementById(id + 'Value').textContent = e.target.value;
                this.applyCurrentTransformations();
            });
        });
        
        // Вращение
        document.getElementById('rotateAngle').addEventListener('input', (e) => {
            document.getElementById('rotateAngleValue').textContent = e.target.value;
            this.applyCurrentTransformations();
        });
        
        document.getElementById('rotateAxis').addEventListener('change', (e) => {
            document.getElementById('customAxisControls').style.display = 
                e.target.value === 'custom' ? 'block' : 'none';
            this.applyCurrentTransformations();
        });
        
        // Произвольная ось
        ['axisX', 'axisY', 'axisZ'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                document.getElementById(id + 'Value').textContent = e.target.value;
                this.applyCurrentTransformations();
            });
        });
        
        // Проекции
        document.getElementById('showProjections').addEventListener('change', (e) => {
            this.showProjections = e.target.checked;
            // В упрощенной версии скроем/покажем проекции
        });
        
        // Сброс преобразований
        document.getElementById('resetTransform').addEventListener('click', () => {
            this.resetTransformations();
        });
        
        // Вкладки сцен
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const scene = e.target.dataset.scene;
                this.switchScene(scene);
            });
        });
        
        // Изменение размера окна
        window.addEventListener('resize', () => this.onWindowResize());
    },
    
    // Сброс всех преобразований
    resetTransformations: function() {
        // Сбрасываем значения контролов
        document.getElementById('scale').value = 1.0;
        document.getElementById('scaleValue').textContent = '1.0';
        
        document.getElementById('translateX').value = 0;
        document.getElementById('translateY').value = 0;
        document.getElementById('translateZ').value = 0;
        document.getElementById('translateXValue').textContent = '0.0';
        document.getElementById('translateYValue').textContent = '0.0';
        document.getElementById('translateZValue').textContent = '0.0';
        
        document.getElementById('rotateAngle').value = 0;
        document.getElementById('rotateAngleValue').textContent = '0';
        
        document.getElementById('rotateAxis').value = 'x';
        document.getElementById('customAxisControls').style.display = 'none';
        
        document.getElementById('axisX').value = 1;
        document.getElementById('axisY').value = 0;
        document.getElementById('axisZ').value = 0;
        document.getElementById('axisXValue').textContent = '1.0';
        document.getElementById('axisYValue').textContent = '0.0';
        document.getElementById('axisZValue').textContent = '0.0';
        
        // Обновляем объект
        this.applyCurrentTransformations();
    },
    
    // Переключение сцены
    switchScene: function(scene) {
        // Обновляем активную кнопку
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.scene === scene) {
                btn.classList.add('active');
            }
        });
        
        this.currentScene = scene;
        
        // Настраиваем камеру
        const container = document.getElementById('scene3d');
        
        if (scene === 'main') {
            this.camera = new THREE.PerspectiveCamera(
                60,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            );
            this.camera.position.set(8, 8, 12);
            
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 30;
        } else {
            // Ортографическая камера для проекций
            const aspect = container.clientWidth / container.clientHeight;
            const size = 10;
            
            let camera;
            switch(scene) {
                case 'xy':
                    camera = new THREE.OrthographicCamera(
                        -size, size, size/aspect, -size/aspect, 0.1, 1000
                    );
                    camera.position.set(0, 0, 10);
                    camera.lookAt(0, 0, 0);
                    break;
                case 'xz':
                    camera = new THREE.OrthographicCamera(
                        -size, size, size/aspect, -size/aspect, 0.1, 1000
                    );
                    camera.position.set(0, 10, 0);
                    camera.lookAt(0, 0, 0);
                    camera.up.set(0, 0, -1);
                    break;
                case 'yz':
                    camera = new THREE.OrthographicCamera(
                        -size, size, size/aspect, -size/aspect, 0.1, 1000
                    );
                    camera.position.set(10, 0, 0);
                    camera.lookAt(0, 0, 0);
                    break;
            }
            
            this.camera = camera;
            this.controls = null;
        }
    },
    
    // Обновление информации о модели
    updateModelInfo: function() {
        // Для упрощения фиксированные значения
        document.getElementById('vertexCount').textContent = "~100";
        document.getElementById('faceCount').textContent = "~150";
    },
    
    // Изменение размера окна
    onWindowResize: function() {
        const container = document.getElementById('scene3d');
        
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
        } else if (this.camera instanceof THREE.OrthographicCamera) {
            const aspect = container.clientWidth / container.clientHeight;
            const size = 10;
            this.camera.left = -size;
            this.camera.right = size;
            this.camera.top = size / aspect;
            this.camera.bottom = -size / aspect;
            this.camera.updateProjectionMatrix();
        }
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    },
    
    // Анимация
    animate: function() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
};

// Запуск при загрузке
window.addEventListener('DOMContentLoaded', () => {
    GraphicsLab.init();
});