Bilibili-danmaku-translation-recorder
=====

本项目为[Vtb_Record](https://github.com/fzxiao233/Vtb_Record)的同传记录模块，亦可独立使用

用法
-------

- 与Vtb_Record一同使用
    
    将index.js放入含有config.json的目录下，启动即可
    
- 独立使用

    新建config.json文件，在文件中写入
    
    ```json
     {"ExpressPort": 3000,
      "DownloadDir": "D:"}
    ```
    ExpressPort为监听端口，DownloadDir为同传记录文件保存目录
    
 - 调用方式
    
        GET localhost:3000/api/live?roomId={roomId}&status={status}&filename={filename}
        roomId 直播间号
        status 状态（1 表示开始记录 0 表示停止记录）
        filename 记录文件名