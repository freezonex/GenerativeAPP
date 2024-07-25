const fs = require('fs');
const path = require('path');

export function generateComponent(componentName, componentCode) {
  const componentDir = path.join(process.cwd(), 'src/components');
  const filePath = path.join(componentDir, `${componentName}.tsx`);

  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  fs.writeFileSync(filePath, componentCode);

  console.log(`组件 ${componentName} 已成功创建在 ${filePath}`);
}
