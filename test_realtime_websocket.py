#!/usr/bin/env python3
"""
Тест real-time обновлений WebSocket при файловых операциях
"""
import asyncio
import websockets
import json
import os
import time

async def test_realtime_updates():
    uri = "ws://localhost:8001/ws/filemanager/"
    test_file = "/workspaces/codespaces-django/test_dragdrop/websocket_test.txt"
    
    try:
        print(f"🔌 Подключаемся к {uri}...")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket подключен!")
            
            # Подписываемся на обновления
            subscribe_msg = {
                "action": "subscribe",
                "data": {"path": "/workspaces/codespaces-django/test_dragdrop"}
            }
            await websocket.send(json.dumps(subscribe_msg))
            print("📡 Подписались на обновления папки test_dragdrop")
            
            # Слушаем сообщения в фоне
            async def listen_messages():
                while True:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)
                        if data.get('type') == 'file_change':
                            print(f"🔄 Real-time обновление: {data}")
                        else:
                            print(f"📥 Сообщение: {data.get('type', 'unknown')}")
                    except asyncio.TimeoutError:
                        continue
                    except Exception as e:
                        print(f"❌ Ошибка при получении сообщения: {e}")
                        break
            
            # Запускаем прослушивание в фоне
            listen_task = asyncio.create_task(listen_messages())
            
            # Создаем тестовый файл
            print("📝 Создаем тестовый файл...")
            with open(test_file, 'w', encoding='utf-8') as f:
                f.write(f"Тест WebSocket обновлений - {time.time()}")
            
            await asyncio.sleep(2)
            
            # Изменяем файл
            print("✏️ Изменяем файл...")
            with open(test_file, 'a', encoding='utf-8') as f:
                f.write(f"\\nДобавлена строка - {time.time()}")
            
            await asyncio.sleep(2)
            
            # Удаляем файл
            print("🗑️ Удаляем файл...")
            if os.path.exists(test_file):
                os.remove(test_file)
            
            await asyncio.sleep(2)
            
            # Останавливаем прослушивание
            listen_task.cancel()
            print("✅ Тест завершен!")
            
    except Exception as e:
        print(f"❌ Ошибка WebSocket: {e}")

if __name__ == "__main__":
    print("🚀 Запускаем тест real-time обновлений...")
    asyncio.run(test_realtime_updates())
