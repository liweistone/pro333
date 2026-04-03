
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Keys (Ideally these should be in environment variables)
  const AUTH_KEY = "sk-0gfBZS8IJc19XTIfGtD3YUdRrv4AnUHsn6PPWxTNViYjon9T";

  // Proxy for Chat API (Used by app5 and potentially others)
  app.post("/api/v1/chat/completions", async (req, res) => {
    try {
      const response = await fetch("https://api.apimart.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AUTH_KEY}`
        },
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Chat API Proxy Error:", error);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // Proxy for Image Generation API
  app.post("/api/v1/images/generations", async (req, res) => {
    try {
      const response = await fetch("https://api.apimart.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AUTH_KEY}`
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Image Gen API Proxy Error:", error);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // Proxy for Task Status API
  app.get("/api/v1/tasks/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { language = 'zh' } = req.query;
      const response = await fetch(`https://api.apimart.ai/v1/tasks/${taskId}?language=${language}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${AUTH_KEY}`
        }
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Task Status API Proxy Error:", error);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
