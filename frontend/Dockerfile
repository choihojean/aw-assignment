#Node.js Next.js 컨테이너
FROM node:20

#디렉토리 설정
WORKDIR /app

#패키지 설치
COPY package.json package-lock.json ./
RUN npm install

#소스 코드
COPY . .

#Next.js 앱 실행
CMD ["npm", "run", "dev"]
