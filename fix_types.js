const fs = require('fs');
const path = require('path');

const dir = '/home/ubuntu/arqai-frontends/arth-sarthi-frontend/components/ui';

fs.readdir(dir, (err, files) => {
  if (err) throw err;

  files.forEach(file => {
    if (!file.endsWith('.tsx')) return;

    const filePath = path.join(dir, file);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) throw err;

      let newData = data;
      let modified = false;

      // Regex to find React.forwardRef without generics
      // Matches: const ComponentName = React.forwardRef(({ ... }, ref) =>
      const regex = /const (\w+) = React.forwardRef\(\s*\(\{/g;
      
      if (newData.match(regex)) {
        newData = newData.replace(regex, (match, componentName) => {
          return `const ${componentName} = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({`;
        });
        modified = true;
      }

      // Also fix cases where function body start might vary slightly
      // e.g. React.forwardRef((props, ref)
      const regex2 = /const (\w+) = React.forwardRef\(\s*\((props|\w+), ref\)/g;
      if (newData.match(regex2)) {
        newData = newData.replace(regex2, (match, componentName, propsName) => {
             return `const ${componentName} = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((${propsName}, ref)`;
        });
        modified = true;
      }

      // Match functional components: const Component = ({ className, ...props }) =>
      const regex3 = /const (\w+) = \(\{\s*className,\s*\.\.\.props\s*\}\) =>/g;
      if (newData.match(regex3)) {
         newData = newData.replace(regex3, (match, componentName) => {
              return `const ${componentName} = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) =>`;
         });
         modified = true;
      }

      if (modified) {
        console.log(`Fixing ${file}...`);
        fs.writeFile(filePath, newData, 'utf8', (err) => {
          if (err) console.error(`Error writing ${file}:`, err);
        });
      }
    });
  });
});
