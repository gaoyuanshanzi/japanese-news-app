"use client";

import { useState, useEffect } from "react";
import { Play, RefreshCw, ChevronRight, Lock } from "lucide-react";
import styles from "./page.module.css";

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
};

type ProcessedArticle = {
  furiganaHtml: string;
  translation: string;
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [article, setArticle] = useState<ProcessedArticle | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);

  useEffect(() => {
    // Check local storage for auth state
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("news_auth");
      if (auth === "true") {
        setIsLoggedIn(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "123jesus") {
      setIsLoggedIn(true);
      localStorage.setItem("news_auth", "true");
    } else {
      alert("Invalid credentials.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("news_auth");
  };

  const fetchNews = async () => {
    setIsLoadingNews(true);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setNewsList(data.items || []);
    } catch (err) {
      console.error(err);
      alert("Error fetching news.");
    } finally {
      setIsLoadingNews(false);
    }
  };

  const loadArticle = async (news: NewsItem) => {
    setSelectedNews(news);
    setArticle(null);
    setIsLoadingArticle(true);
    try {
      const res = await fetch("/api/process-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: news.link })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process article");
      
      setArticle({
        furiganaHtml: data.furiganaHtml,
        translation: data.translation
      });
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setIsLoadingArticle(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.loginContainer}>
        <div className={`glass ${styles.loginBox}`}>
          <div className={styles.loginIconWrapper}>
            <Lock size={24} className={styles.loginIcon} />
          </div>
          <h1 className={styles.loginTitle}>Admin Login</h1>
          <p className={styles.loginSubtitle}>Access the Japanese Learning Platform</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className={styles.input}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className={styles.input}
            />
            <button type="submit" className={styles.primaryButton}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <aside className={`glass ${styles.sidebar}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Latest News</h2>
          <button 
            onClick={fetchNews} 
            className={styles.startButton}
            disabled={isLoadingNews}
          >
            {isLoadingNews ? <RefreshCw className={styles.spinIcon} size={18} /> : <Play size={18} />}
            <span>{isLoadingNews ? "Fetching..." : "Start"}</span>
          </button>
        </div>
        
        <div className={styles.newsList}>
          {newsList.length === 0 && !isLoadingNews && (
            <div className={styles.emptyState}>
              <p>Click Start to fetch the latest 5 Japanese news.</p>
            </div>
          )}
          
          {newsList.map((news, idx) => (
            <div 
              key={idx} 
              className={`${styles.newsCard} ${selectedNews?.link === news.link ? styles.activeNewsCard : ''}`}
              onClick={() => loadArticle(news)}
            >
              <h3 className={styles.newsCardTitle}>{news.title}</h3>
              <div className={styles.newsCardFooter}>
                <span className={styles.newsDate}>
                  {new Date(news.pubDate).toLocaleDateString()}
                </span>
                <ChevronRight size={14} className={styles.newsChevron} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {!selectedNews ? (
          <div className={styles.placeholderView}>
            <div className={styles.placeholderIconWrapper}>
              <RefreshCw size={48} className={styles.placeholderIcon} />
            </div>
            <h2>Select a news article</h2>
            <p>Fetch and click a news item from the sidebar to start learning.</p>
          </div>
        ) : (
          <div className={`glass ${styles.articleView}`}>
            <h1 className={styles.articleTitle}>{selectedNews.title}</h1>
            <a href={selectedNews.link} target="_blank" rel="noreferrer" className={styles.articleLink}>
              View Original Article
            </a>
            
            {isLoadingArticle ? (
              <div className={styles.loadingView}>
                <div className="loader"></div>
                <p>Processing text, adding Furigana, and translating...</p>
              </div>
            ) : article ? (
              <div className={styles.articleBody}>
                <div className={styles.japaneseSection}>
                  <h3 className={styles.sectionTitle}>Japanese Text</h3>
                  <div 
                    className={styles.furiganaContent} 
                    dangerouslySetInnerHTML={{ __html: article.furiganaHtml }} 
                  />
                </div>
                
                <div className={styles.translationSection}>
                  <h3 className={styles.sectionTitle}>Korean Translation</h3>
                  <div className={styles.koreanContent}>
                    {article.translation}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
