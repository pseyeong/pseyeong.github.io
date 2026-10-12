// npm 스크립트에서 Maven Wrapper 를 윈도우·맥·리눅스 구분 없이 실행한다.
// 사용: node scripts/mvnw.js spring-boot:run
const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

// 윈도우는 현재 폴더를 실행 경로에서 찾지 않는 환경이 있어 절대 경로로 부른다.
// .cmd 는 윈도우에서 shell 이 있어야 실행되므로 경로를 따옴표로 감싼다.
const command = isWindows ? `"${path.join(root, 'mvnw.cmd')}"` : path.join(root, 'mvnw');

const child = spawn(command, process.argv.slice(2), {
  cwd: root,
  stdio: 'inherit',
  shell: isWindows,
});
child.on('exit', (code) => process.exit(code ?? 0));
