'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'table_not_found' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [tableName, setTableName] = useState('categories')
  const [data, setData] = useState<any[] | null>(null)
  const [loadingQuery, setLoadingQuery] = useState(false)

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const testConnection = async (targetTable: string) => {
    setLoadingQuery(true)
    setErrorMessage('')
    setData(null)

    if (!envUrl || !envKey) {
      setStatus('error')
      setErrorMessage('Thiếu biến môi trường! Kiểm tra file .env.local trong ManageMoney (NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY).')
      setLoadingQuery(false)
      return
    }

    try {
      const { data: result, error } = await supabase
        .from(targetTable)
        .select('*')
        .limit(10)

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setStatus('table_not_found')
          setErrorMessage(`Kết nối Supabase THÀNH CÔNG, nhưng chưa tìm thấy bảng "${targetTable}". Bạn cần chạy file supabase_schema.sql trong SQL Editor của Supabase.`)
        } else {
          setStatus('error')
          setErrorMessage(`Lỗi truy vấn (${error.code || 'UNKNOWN'}): ${error.message}`)
        }
      } else {
        setStatus('success')
        setData(result || [])
      }
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(`Lỗi kết nối Supabase: ${err.message}`)
    } finally {
      setLoadingQuery(false)
    }
  }

  useEffect(() => {
    testConnection(tableName)
  }, [])

  return (
    <div style={{
      maxWidth: '850px',
      margin: '40px auto',
      padding: '32px',
      backgroundColor: '#0f172a',
      borderRadius: '16px',
      border: '1px solid #1e293b',
      color: '#f8fafc',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '24px', color: '#38bdf8', marginTop: 0 }}>
        💰 MoneySmartflow - Kiểm tra kết nối Supabase
      </h1>
      
      <div style={{
        backgroundColor: '#1e293b',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        border: '1px solid #334155'
      }}>
        <div><strong>URL:</strong> <code style={{ color: '#38bdf8' }}>{envUrl || 'Chưa có'}</code></div>
        <div style={{ marginTop: '4px' }}>
          <strong>Anon Key:</strong> <code style={{ color: '#38bdf8' }}>{envKey ? `${envKey.substring(0, 20)}...` : 'Chưa có'}</code>
        </div>
      </div>

      <div style={{
        padding: '16px 20px',
        borderRadius: '10px',
        marginBottom: '20px',
        backgroundColor: status === 'success' ? '#064e3b' : status === 'loading' ? '#1e293b' : '#7f1d1d',
        border: `1px solid ${status === 'success' ? '#10b981' : status === 'loading' ? '#475569' : '#ef4444'}`
      }}>
        {status === 'loading' && <div>⌛ Đang thử kết nối...</div>}
        {status === 'success' && (
          <div>
            <h3 style={{ margin: '0 0 6px 0', color: '#34d399' }}>✅ Kết nối Supabase thành công!</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#a7f3d0' }}>
              Đã lấy được {data?.length || 0} bản ghi từ bảng <code>{tableName}</code>.
            </p>
          </div>
        )}
        {status === 'table_not_found' && (
          <div>
            <h3 style={{ margin: '0 0 6px 0', color: '#fbbf24' }}>⚠️ Kết nối thành công! (Bảng chưa tạo)</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#fde68a' }}>{errorMessage}</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <h3 style={{ margin: '0 0 6px 0', color: '#fca5a5' }}>❌ Lỗi kết nối</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#fecaca' }}>{errorMessage}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          placeholder="Nhập tên bảng (categories, transactions...)"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#fff',
            outline: 'none'
          }}
        />
        <button
          onClick={() => testConnection(tableName)}
          disabled={loadingQuery}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {loadingQuery ? 'Đang thử...' : 'Thử lại'}
        </button>
      </div>

      {data && (
        <pre style={{
          backgroundColor: '#1e293b',
          padding: '16px',
          borderRadius: '8px',
          overflowX: 'auto',
          color: '#38bdf8',
          fontSize: '13px'
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
