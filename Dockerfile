# Используем легкий образ nginx
FROM nginx:alpine

# Копируем все файлы в папку nginx
COPY . /usr/share/nginx/html/

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]