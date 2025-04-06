import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [productName, setProductName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productList, setProductList] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('https://us-central1-expiryalertapp.cloudfunctions.net/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      setMessage(data.message);
      if (res.ok) {
        setIsAuthenticated(true);
        setIsDemoMode(false);
        fetchProducts();
      }
    } catch (e) {
      setMessage('로그인 실패');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('✅ handleSubmit 실행됨');
  
    if (!productName || !expiryDate) {
      console.log('⛔️ 필수 값 누락:', productName, expiryDate);
      alert('Product Name and Expiry Date is required.');
      return;
    }
  
    const item = {
      name: productName,
      date: expiryDate,
      barcode: barcode || '',
      quantity: quantity || '',
      createdAt: new Date().toISOString(),
    };
  
    if (isDemoMode) {
      let updated = [...productList];
      if (editId) {
        updated = updated.map((p) => (p.id === editId ? { ...item, id: editId } : p));
      } else {
        updated.push({ ...item, id: Date.now().toString() });
      }
      setProductList(updated);
      resetForm();
    } else {
      try {
        if (editId) {
          const ref = doc(db, 'products', editId);
          await updateDoc(ref, item);
          alert('✅ 	Update successful!');
        } else {
          await addDoc(collection(db, 'products'), item);
          alert('✅ Product added!');
        }
  
        resetForm();
        await fetchProducts();
      } catch (e) {
        console.error('❌ Failed to add product:', e);
        alert('Failed to add product');
      }
    }
  };
  
  
    

  const resetForm = () => {
    setProductName('');
    setExpiryDate('');
    setBarcode('');
    setQuantity('');
    setEditId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    if (isDemoMode) {
      setProductList(productList.filter((p) => p.id !== id));
    } else {
      try {
        await deleteDoc(doc(db, 'products', id));
        setProductList(productList.filter((p) => p.id !== id));
      } catch (e) {
        alert('Failed to delete');
      }
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setProductName(item.name);
    setExpiryDate(item.date);
    setBarcode(item.barcode || '');
    setQuantity(item.quantity || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductList(items);
    } catch (e) {
      console.error('❌ Failed to fetch products:', e);
    }
  };

  const getDdayLabel = (dateStr: string) => {
    const today = new Date();
    const target = new Date(dateStr);
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return ' (D-day)';
    if (diff > 0) return ` (D-${diff})`;
    return ` (D+${Math.abs(diff)})`;
  };

  useEffect(() => {
    if (isAuthenticated && !isDemoMode) {
      fetchProducts();
    }
  }, [isAuthenticated]);
  
  return (
    <div className="container">
      <h2 className="header">📦 Expiry Alert</h2>

      {!isAuthenticated && !isDemoMode && (
        <form onSubmit={handleLogin}>
          <label className="label">Username</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />

          <button type="submit" className="button">Login</button>
          <button type="button" onClick={() => setIsDemoMode(true)} className="button" style={{ marginTop: '10px' }}>
            ✅ Try Demo
          </button>

          {message && <p style={{ color: 'red' }}>{message}</p>}
        </form>
      )}

      {(isAuthenticated || isDemoMode) && (
        <>
          <form onSubmit={handleSubmit}>
            <label className="label">Product Name</label>
            <input
              className="input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />

            <label className="label">Expiry Date</label>
            <input
              className="input"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />

            <label className="label">Barcode (last 4–6 digits)</label>
            <input
              className="input"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              maxLength={6}
            />

            <label className="label">Quantity</label>
            <input
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <button type="submit" className="button">
              {editId ? 'Update' : 'Add Product'}
            </button>
          </form>


          {productList.length > 0 && (
            <div className="list-section">
              <h3 className="subheader">📋 Registered Products</h3>
              {productList.map((item) => (
                <div key={item.id} className="card">
                  <p>📦 {item.name}</p>
                  <p>⏰ {item.date}{getDdayLabel(item.date)}</p>
                  <p>🔢 Barcode: {item.barcode || 'None'} / Quantity: {item.quantity || 'None'}</p>
                  <div className="button-group">
                    <button onClick={() => handleEdit(item)} className="small-button blue">Update</button>
                    <button onClick={() => handleDelete(item.id)} className="small-button red">	Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
