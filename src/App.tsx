// src/App.tsx
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

function App() {
  const container = {
    padding: '16px',
    maxWidth: '420px',
    margin: '0 auto',
    fontFamily: 'system-ui, sans-serif',
  };
  
  const header = {
    fontSize: '22px',
    marginBottom: '20px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
  };
  
  const subHeader = {
    fontSize: '18px',
    marginBottom: '14px',
    fontWeight: 'bold',
  };
  
  const label = {
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 500,
  };
  
  const input = {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    outline: 'none',
  };
  
  const button = {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  };
  
  const card = {
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    fontSize: '15px',
  };
  
  const smallButtonBlue = {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
  };
  
  const smallButtonRed = {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
  };

  const [productName, setProductName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productList, setProductList] = useState<any[]>([]);
  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
  
    try {
      await deleteDoc(doc(db, 'products', id));
      setProductList((prev) => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error('삭제 중 오류:', e);
      alert('삭제 실패');
    }
  };
  const [editId, setEditId] = useState<string | null>(null);
  const getDdayLabel = (dateString: string) => {
    const today = new Date();
    const target = new Date(dateString);
  
    // 시간 0시로 설정 (날짜만 비교)
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
  
    const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
    if (diff === 0) return ' (D-day)';
    if (diff > 0) return ` (D-${diff})`;
    return ` (D+${Math.abs(diff)})`; // 지난 날짜
  };
  const handleEdit = (item: any) => {
    setEditId(item.id);
    setProductName(item.name);
    setExpiryDate(item.date);
    setBarcode(item.barcode || '');
    setQuantity(item.quantity || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleSubmit = async () => {
    if (!productName || !expiryDate) {
      alert('상품명과 유통기한은 필수입니다.');
      return;
    }
  
    if (editId) {
      try {
        const ref = doc(db, 'products', editId);
        await updateDoc(ref, {
          name: productName,
          date: expiryDate,
          barcode: barcode || '',
          quantity: quantity || '',
        });
        alert('✅ 수정 완료!');
        setEditId(null);
      } catch (e) {
        alert('수정 실패');
        console.error(e);
      }
    } else {
      try {
        await addDoc(collection(db, 'products'), {
          name: productName,
          date: expiryDate,
          barcode: barcode || '',
          quantity: quantity || '',
          createdAt: new Date().toISOString(),
        });
        alert('✅ 등록되었습니다!');
      } catch (e) {
        alert('등록 중 오류 발생');
        console.error(e);
      }
    }
  
    setProductName('');
    setExpiryDate('');
    setBarcode('');
    setQuantity('');
    fetchProducts();
  };
  

  useEffect(() => {
    fetchProducts();
  }, []);
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProductList(items);
      } catch (e) {
        console.error('데이터 불러오기 실패:', e);
      }
    };

    return (
      <div style={container}>
        <h2 style={header}>📦 상품 등록</h2>
    
        <label style={label}>상품명</label>
        <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="예: 우유" style={input} />
    
        <label style={label}>유통기한</label>
        <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={input} />
    
        <label style={label}>바코드 (끝 4~6자리)</label>
        <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="예: 1234" maxLength={6} style={input} />
    
        <label style={label}>수량</label>
        <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="예: 4개입 5박스" style={input} />
    
        <button onClick={handleSubmit} style={button}>
          {editId ? '수정하기' : '등록하기'}
        </button>
    
        {productList.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h3 style={subHeader}>📋 등록된 상품 목록</h3>
            {productList.map((item, index) => (
              <div key={index} style={card}>
                <div style={{ marginBottom: '8px' }}><strong>📦 {item.name}</strong></div>
                <div>⏰ 유통기한: {item.date}{getDdayLabel(item.date)}</div>
                <div>🔢 바코드: {item.barcode || '없음'}</div>
                <div>📦 수량: {item.quantity || '없음'}</div>
    
                <div style={{ display: 'flex', marginTop: '12px', gap: '8px' }}>
                  <button onClick={() => handleEdit(item)} style={smallButtonBlue}>수정</button>
                  <button onClick={() => handleDelete(item.id)} style={smallButtonRed}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )};
    


export default App;
