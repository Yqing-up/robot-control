@echo off
echo 正在解决Git合并冲突...

echo 添加已解决冲突的文件到暂存区...
git add src/views/ManagementView.vue

echo 检查Git状态...
git status

echo 完成合并提交...
git commit -m "解决合并冲突：合并chatApi和头部控制API导入"

echo 合并完成！
pause
