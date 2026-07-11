<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6366F1,100:22D3EE&height=220&section=header&text=CodeMentor%20AI&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Your%20AI-Powered%20Code%20Review%20%26%20Learning%20Companion&descAlignY=55&descSize=18" width="100%"/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&duration=3000&pause=800&color=6366F1&center=true&vCenter=true&width=650&lines=Review+code+like+a+senior+engineer;Detect+bugs%2C+warnings+%26+bad+practices;Learn+the+%22why%22%2C+not+just+the+fix;Built+with+Next.js+%2B+OpenAI+%2B+MongoDB" alt="Typing SVG" />

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#-license)

<br/>

[![Stars](https://img.shields.io/github/stars/bhumisingh-ui/codementor-ai?style=social)](https://github.com/bhumisingh-ui/codementor-ai/stargazers)
[![Forks](https://img.shields.io/github/forks/bhumisingh-ui/codementor-ai?style=social)](https://github.com/bhumisingh-ui/codementor-ai/network/members)
[![Issues](https://img.shields.io/github/issues/bhumisingh-ui/codementor-ai?color=orange)](https://github.com/bhumisingh-ui/codementor-ai/issues)
[![Last Commit](https://img.shields.io/github/last-commit/bhumisingh-ui/codementor-ai?color=blueviolet)](https://github.com/bhumisingh-ui/codementor-ai/commits/main)

</div>

<br/>

## ✨ Overview

**CodeMentor AI** is an AI-powered code review and learning platform built to help developers write cleaner, safer, and smarter code. Instead of just flagging what's wrong, it **teaches you why** — turning every review into a mini lesson.

Paste your code (or upload a file), pick a language, and let the AI mentor walk you through bugs, anti-patterns, and improvements — all inside a VS Code–style editor, right in your browser.

<br/>

## 🖥️ App Preview

<div align="center">

### 🧠 AI Code Review
<img src="https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif" width="85%" alt="AI Code Review Demo"/>

### 💻 Monaco Code Editor
<img src="https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif" width="85%" alt="Monaco Editor Demo"/>

</div>

<br/>

## 🎯 What It Does

<table>
<tr>
<td width="50%" valign="top">

**🔍 Reviews code using AI**
Get instant, structured feedback on any snippet — not just linter noise.

**🐞 Detects issues that matter**
Bugs, security smells, bad practices, and style violations are all caught automatically.

</td>
<td width="50%" valign="top">

**💡 Explains the *why***
Every flagged issue comes with reasoning, not just a red squiggle.

**📚 Built for learning**
Designed to level you up as a developer — not just patch your code.

</td>
</tr>
</table>

<br/>

## 🚀 Features

| | Feature | Description |
|---|---|---|
| 🧠 | **AI-Powered Code Review** | Deep, context-aware feedback powered by the OpenAI API |
| 💻 | **Monaco Editor** | The same editor that powers VS Code, right in your browser |
| 🌐 | **Multi-Language Support** | JavaScript, Python, Java, C++, and Go |
| 📁 | **Paste or Upload** | Paste code directly or upload a file for review |
| 👥 | **User Authentication** | Secure sign-up / sign-in flow |
| 📊 | **Progress Tracking** | Visual insights into your growth over time, via Chart.js |
| 👨‍🏫 | **AI Tutor Mode** | Ask follow-up questions and get guided explanations |
| 🤝 | **Collaborative Coding** | Real-time pair review sessions *(planned)* |

<br/>

## 🧱 Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | Next.js · React · Tailwind CSS |
| **Editor** | Monaco Editor |
| **Backend** | Next.js API Routes |
| **Database** | MongoDB Atlas |
| **AI Engine** | OpenAI API |
| **Auth** | Custom authentication |

</div>

<br/>

## 📂 Project Structure

```
codementor-ai/
├── public/            # Static assets (images, icons, etc.)
├── services/          # API / integration layer (OpenAI, DB, etc.)
├── src/                # Application source (pages/components/logic)
├── workers/            # Background / worker processes
├── eslint.config.mjs
├── next.config.mjs
├── postcss.config.mjs
└── package.json
```

<br/>

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas connection string
- An OpenAI API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/bhumisingh-ui/codementor-ai.git
cd codementor-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local   # then fill in the values below

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see it running. 🎉

### Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
OPENAI_API_KEY=your_openai_api_key
AUTH_SECRET=your_auth_secret
```

> ⚠️ Never commit your `.env.local` file — it's already covered by `.gitignore`.

<br/>

## 🗺️ Roadmap

- [x] AI-powered code review
- [x] Monaco editor integration
- [x] Multi-language support
- [x] Progress tracking dashboard
- [ ] Real-time collaborative coding
- [ ] AI-generated practice challenges
- [ ] VS Code extension

<br/>

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<br/>

## 📄 License

This project is licensed under the **MIT License**.

<br/>

<div align="center">


*If CodeMentor AI helped you, consider giving it a ⭐ — it really helps!*

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:22D3EE,100:6366F1&height=120&section=footer" width="100%"/>

</div>
