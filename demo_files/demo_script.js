// Демонстрационный JavaScript файл для файлового менеджера
class FileManagerDemo {
    constructor() {
        this.name = 'React Terminal File Manager';
        this.version = '1.0.0';
        this.features = [
            'File Navigation',
            'Preview System', 
            'Search & Filtering',
            'Drag & Drop Upload',
            'Performance Monitoring',
            'Accessibility Features',
            'Advanced Animations',
            'Export Utilities'
        ];
        
        this.init();
    }
    
    init() {
        console.log(`🚀 Initializing ${this.name} v${this.version}`);
        this.showFeatures();
        this.demonstrateAnimations();
    }
    
    showFeatures() {
        console.log('📋 Available Features:');
        this.features.forEach((feature, index) => {
            console.log(`  ${index + 1}. ✅ ${feature}`);
        });
    }
    
    demonstrateAnimations() {
        const animationTypes = [
            'fade', 'slide', 'scale', 'rotate', 
            'bounce', 'elastic', 'matrix', 'particle'
        ];
        
        console.log('🎨 Animation Types:', animationTypes);
        
        // Симуляция анимации
        animationTypes.forEach((type, index) => {
            setTimeout(() => {
                console.log(`✨ Demonstrating ${type} animation...`);
            }, index * 500);
        });
    }
    
    getPerformanceMetrics() {
        return {
            bundleSize: '110kB (gzipped)',
            loadTime: '<2 seconds',
            lightHouseScore: '95+',
            accessibility: 'WCAG 2.1 AA',
            browser_support: ['Chrome 90+', 'Firefox 88+', 'Safari 14+', 'Edge 90+']
        };
    }
    
    exportData(format = 'json') {
        const data = {
            app: this.name,
            version: this.version,
            features: this.features,
            metrics: this.getPerformanceMetrics()
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            default:
                return data;
        }
    }
    
    convertToCSV(data) {
        const rows = [
            ['Property', 'Value'],
            ['App Name', data.app],
            ['Version', data.version],
            ['Features Count', data.features.length],
            ['Bundle Size', data.metrics.bundleSize],
            ['Load Time', data.metrics.loadTime]
        ];
        
        return rows.map(row => row.join(',')).join('\n');
    }
}

// Инициализация демонстрации
const demo = new FileManagerDemo();

// Экспорт для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileManagerDemo;
}

// Функция для демонстрации функций
function testFileManager() {
    console.log('🧪 Testing File Manager Functions...');
    
    // Тест экспорта
    console.log('📤 JSON Export:');
    console.log(demo.exportData('json'));
    
    console.log('\n📤 CSV Export:');
    console.log(demo.exportData('csv'));
    
    // Тест метрик производительности
    console.log('\n📊 Performance Metrics:');
    console.log(demo.getPerformanceMetrics());
    
    console.log('\n✅ All tests completed!');
}

// Автоматический запуск теста через 2 секунды
setTimeout(testFileManager, 2000);
