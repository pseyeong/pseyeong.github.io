$(function(){
    tailwindCode();
})

function tailwindCode(){
    const tailwindCode = `{
  "scripts": {
    "watch": "npx @tailwindcss/cli -i ./src/input.css -o ./dist/output.css --watch",
    "build": "npx @tailwindcss/cli -i ./src/input.css -o ./dist/output.css --minify"
  }
}`.trim();
    $(".tailwind-code").text(tailwindCode);
}