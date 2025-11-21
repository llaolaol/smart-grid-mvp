/**
 * Simple Test Page
 */

const Test = () => {
  return (
    <div style={{ padding: '50px', background: 'white', color: 'black' }}>
      <h1>测试页面</h1>
      <p>如果你能看到这个页面，说明React正常工作。</p>
      <div style={{ marginTop: '20px' }}>
        <h2>系统信息</h2>
        <ul>
          <li>时间: {new Date().toLocaleString('zh-CN')}</li>
          <li>浏览器: {navigator.userAgent}</li>
        </ul>
      </div>
    </div>
  );
};

export default Test;
