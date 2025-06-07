#!/usr/bin/env python3
"""
WebSocket test script для проверки подключения к нашему WebSocket серверу
"""
import asyncio
import websockets
import json
import sys

async def test_websocket():
    uri = "ws://localhost:8001/ws/filemanager/"
    
    try:
        print(f"Подключаемся к {uri}...")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket соединение установлено!")
            
            # Отправляем ping
            ping_message = {
                "action": "ping",
                "data": {"message": "test ping"}
            }
            await websocket.send(json.dumps(ping_message))
            print("📤 Отправлен ping")
            
            # Получаем ответ
            response = await websocket.recv()
            print(f"📥 Получен ответ: {response}")
            
            # Запрашиваем список файлов
            files_message = {
                "action": "list_files",
                "data": {"path": "/"}
            }
            await websocket.send(json.dumps(files_message))
            print("📤 Запросили список файлов")
            
            # Получаем ответ
            response = await websocket.recv()
            print(f"📥 Получен ответ: {response}")
            
            # Запрашиваем информацию о проекте
            project_message = {
                "action": "get_project_info"
            }
            await websocket.send(json.dumps(project_message))
            print("📤 Запросили информацию о проекте")
            
            # Получаем ответ
            response = await websocket.recv()
            print(f"📥 Получен ответ: {response}")
            
            print("✅ Тест завершен успешно!")
            
    except websockets.exceptions.ConnectionClosedError:
        print("❌ WebSocket соединение было закрыто")
        sys.exit(1)
    except ConnectionRefusedError:
        print("❌ Не удается подключиться к WebSocket серверу")
        print("Убедитесь, что ASGI сервер запущен на порту 8001")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_websocket())
