import React from 'react';
import '../css/LatestBlog.css';
import thumb1 from '../assets/58669726_2453578164652558_7271337253685690368_n.jpg';

function LatestBlog() {
  const blogs = [
    { id: 1, title: 'VIDEO Content ดีสำหรับธุรกิจในหลาย Platform', date: 'NOV 29, 2024', thumb: thumb1, cat: 'Marketing' },
    { id: 2, title: 'การนำเสนอ Presentation ให้ทรงพลังมากกว่าแค่ทฤษฎี', date: 'NOV 27, 2024', thumb: thumb1, cat: 'Creative' },
    { id: 3, title: 'Digital Marketing กับ Online Marketing ต่างกันอย่างไร?', date: 'NOV 25, 2024', thumb: thumb1, cat: 'Tips' },
  ];

  return (
    <section className="modern-blog-section">
      <div className="home-container-width">
        {/* Header สไตล์เดียวกับ Service และ Clients */}
        <div className="blog-premium-header">
          <div className="header-left">
            <span className="red-tag-line">INSIGHTS & UPDATES</span>
            <h2 className="blog-huge-title">LATEST BLOG</h2>
          </div>
          <div className="header-right">
            <button className="view-all-minimal">VIEW ALL ARTICLES <span>+</span></button>
          </div>
        </div>

        <div className="blog-modern-grid">
          {blogs.map(blog => (
            <article key={blog.id} className="blog-article-card">
              <div className="blog-visual-wrap">
                <img src={blog.thumb} alt={blog.title} />
                <span className="blog-cat-badge">{blog.cat}</span>
                <div className="blog-visual-overlay"></div>
              </div>
              
              <div className="blog-text-content">
                <div className="blog-meta">
                  <span className="blog-red-date">{blog.date}</span>
                </div>
                <h3 className="blog-item-title">{blog.title}</h3>
                <a href={`/blog/${blog.id}`} className="blog-read-link">
                  READ ARTICLE <span className="arrow-move">→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LatestBlog;