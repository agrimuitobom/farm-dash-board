import React, { useState, useEffect } from 'react';
import { PrinterIcon, AlertCircle, Loader2 } from 'lucide-react';

// 自作コンポーネント
import ReportFilters from '../components/reports/ReportFilters';
import ProductionReport from '../components/reports/ProductionReport';
import ProductivityReport from '../components/reports/ProductivityReport';
import CropTrendsReport from '../components/reports/CropTrendsReport';
import ReportTable from '../components/reports/ReportTable';

// ユーティリティ関数
import { 
  getProductionReport,
  getProductivityReport,
  getCropTrendsReport,
  convertToCSV
} from '../utils/reportGenerator';

// Firestoreユーティリティ
import { getAllHouses, getAllCrops } from '../firestoreUtils';

const Reports = () => {
  // 状態管理
  const [reportType, setReportType] = useState('production');
  const [timePeriod, setTimePeriod] = useState('month');
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(new Date());
  const [houseId, setHouseId] = useState('');
  const [cropId, setCropId] = useState('');
  
  const [houses, setHouses] = useState([]);
  const [crops, setCrops] = useState([]);
  const [reportData, setReportData] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 初期データ読み込み
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // ハウスと作物のデータを取得
        const [housesData, cropsData] = await Promise.all([
          getAllHouses(),
          getAllCrops()
        ]);
        
        if (housesData && housesData.length > 0) {
          setHouses(housesData);
        }
        
        if (cropsData && cropsData.length > 0) {
          setCrops(cropsData);
        }
        
        // 初期レポート生成
        await generateReport();
        
      } catch (err) {
        console.error('データの取得中にエラーが発生しました:', err);
        setError('データの取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // レポート生成関数
  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data = [];
      
      switch (reportType) {
        case 'production':
          data = await getProductionReport(startDate, endDate, houseId);
          break;
        case 'productivity':
          data = await getProductivityReport(startDate, endDate, cropId);
          break;
        case 'trends':
          const months = getMonthsFromTimePeriod();
          data = await getCropTrendsReport(months, cropId);
          break;
        default:
          data = await getProductionReport(startDate, endDate, houseId);
      }
      
      setReportData(data);
      
    } catch (err) {
      console.error('レポート生成中にエラーが発生しました:', err);
      setError('レポート生成中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };
  
  // CSV出力関数
  const handleExportCSV = () => {
    try {
      if (!reportData || reportData.length === 0) {
        alert('出力するデータがありません');
        return;
      }
      
      // CSVに変換
      const csvData = convertToCSV(reportData, reportType);
      
      // CSVファイルとしてダウンロード
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // ファイル名の設定
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `report_${reportType}_${timestamp}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('CSV出力中にエラーが発生しました:', err);
      alert('CSV出力中にエラーが発生しました');
    }
  };
  
  // 印刷関数
  const handlePrint = () => {
    window.print();
  };
  
  // レポートタイプ変更ハンドラー
  const handleReportTypeChange = (type) => {
    setReportType(type);
  };
  
  // 期間タイプ変更ハンドラー
  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    
    // 期間タイプに応じて日付を調整
    const newStartDate = getStartDateForPeriod(period);
    setStartDate(newStartDate);
    setEndDate(new Date());
  };
  
  // 日付変更ハンドラー
  const handleDateChange = (type, value) => {
    switch (type) {
      case 'start':
        setStartDate(new Date(value));
        break;
      case 'end':
        setEndDate(new Date(value));
        break;
      case 'month':
        // yyyy-MM形式から日付を設定
        const [year, month] = value.split('-');
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthEnd = new Date(parseInt(year), parseInt(month), 0); // 月の最終日
        setStartDate(monthStart);
        setEndDate(monthEnd);
        break;
      case 'quarter':
        // 四半期の開始日と終了日を設定
        const currentYear = startDate.getFullYear();
        const quarterStart = new Date(currentYear, (parseInt(value) - 1) * 3, 1);
        const quarterEnd = new Date(currentYear, parseInt(value) * 3, 0);
        setStartDate(quarterStart);
        setEndDate(quarterEnd);
        break;
      case 'year':
        // 年の開始日と終了日を設定
        const yearStart = new Date(parseInt(value), 0, 1);
        const yearEnd = new Date(parseInt(value), 11, 31);
        setStartDate(yearStart);
        setEndDate(yearEnd);
        break;
      default:
        break;
    }
  };
  
  // ハウス選択ハンドラー
  const handleHouseChange = (id) => {
    setHouseId(id);
  };
  
  // 作物選択ハンドラー
  const handleCropChange = (id) => {
    setCropId(id);
  };
  
  // 選択された期間タイプに基づいてデフォルトの開始日を取得
  function getDefaultStartDate() {
    const now = new Date();
    
    switch (timePeriod) {
      case 'month':
        // 現在の月の初日
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        // 現在の四半期の初日
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'year':
        // 現在の年の初日
        return new Date(now.getFullYear(), 0, 1);
      case 'custom':
        // デフォルトでは30日前
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return thirtyDaysAgo;
      default:
        // デフォルトでは月初
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
  
  // 期間タイプに応じた開始日を取得
  function getStartDateForPeriod(period) {
    const now = new Date();
    
    switch (period) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      case 'custom':
        // カスタム期間では現在の開始日を維持
        return startDate;
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
  
  // 期間タイプに応じた月数を取得（トレンドレポート用）
  function getMonthsFromTimePeriod() {
    switch (timePeriod) {
      case 'month':
        return 1;
      case 'quarter':
        return 3;
      case 'year':
        return 12;
      case 'custom':
        // カスタム期間の場合は日付の差から月数を計算
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(1, Math.ceil(diffDays / 30));
      default:
        return 12;
    }
  }
  
  // レポートタイプに応じたタイトルを取得
  function getReportTitle() {
    const dateRangeText = `${startDate.getFullYear()}年${startDate.getMonth() + 1}月 - ${endDate.getFullYear()}年${endDate.getMonth() + 1}月`;
    
    switch (reportType) {
      case 'production':
        return `作物別生産量（${dateRangeText}）`;
      case 'productivity':
        return `ハウス別生産性（${dateRangeText}）`;
      case 'trends':
        return `作物別収穫量推移`;
      default:
        return `レポート（${dateRangeText}）`;
    }
  }
  
  // レポートタイプに応じた単位を取得
  function getReportUnit() {
    switch (reportType) {
      case 'production':
        return 'kg';
      case 'productivity':
        return { quantity: 'kg', area: 'm²' };
      case 'trends':
        return 'kg';
      default:
        return '';
    }
  }
  
  // レポートコンポーネントのレンダリング
  const renderReportComponent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-2" />
          <span className="text-gray-600">データを読み込み中...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      );
    }
    
    switch (reportType) {
      case 'production':
        return (
          <ProductionReport 
            data={reportData} 
            reportTitle={getReportTitle()} 
            unit={getReportUnit()} 
          />
        );
      case 'productivity':
        const units = getReportUnit();
        return (
          <ProductivityReport 
            data={reportData} 
            reportTitle={getReportTitle()} 
            quantityUnit={units.quantity}
            areaUnit={units.area}
          />
        );
      case 'trends':
        return (
          <CropTrendsReport 
            data={reportData} 
            reportTitle={getReportTitle()} 
            unit={getReportUnit()} 
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">統計・レポート</h1>
        <p className="text-gray-600">生産量、収益、費用などの統計データと分析</p>
      </div>
      
      {/* フィルターエリア */}
      <ReportFilters 
        reportType={reportType}
        timePeriod={timePeriod}
        startDate={startDate}
        endDate={endDate}
        houseId={houseId}
        cropId={cropId}
        houses={houses}
        crops={crops}
        onReportTypeChange={handleReportTypeChange}
        onTimePeriodChange={handleTimePeriodChange}
        onDateChange={handleDateChange}
        onHouseChange={handleHouseChange}
        onCropChange={handleCropChange}
        onGenerateReport={generateReport}
        onExportCSV={handleExportCSV}
      />
      
      {/* レポート表示エリア */}
      {renderReportComponent()}
    </div>
  );
};

export default Reports;