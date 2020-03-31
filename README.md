## 打包流程
1. 删除本项目的`dist`文件夹，
2. `robo`项目根目录执行`npm run prod`
3. 复制`robo`项目下的`dist`文件夹到本项目根目录
4. 提交代码并合并到`master`分支，创建一个新的`tag`
5. 如果修改了`robo`中`main.js`的内容，复制`main.js` 到`k4_builder`