          
          {/* 環境データグラフ */}
          <div className="mb-6">
            <EnvironmentalChart 
              data={environmentalHistory}
              onRefresh={() => {
                // 環境データを再取得する処理
                const fetchHistory = async () => {
                  try {
                    const historyData = await getEnvironmentalHistory(id, chartTimeRange);
                    if (historyData && historyData.length > 0) {
                      const formattedHistory = historyData.map(data => formatFirestoreData(data));
                      
                      // グラフ表示用にデータを加工
                      const processedData = formattedHistory.map(data => ({
                        time: data.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '',
                        temperature: data.temperature,
                        humidity: data.humidity,
                        soilMoisture: data.soilMoisture,
                        light: data.light,
                        co2: data.co2
                      }));
                      
                      setEnvironmentalHistory(processedData);
                    }
                  } catch (err) {
                    console.error('環境データ履歴の更新エラー:', err);
                  }
                };
                
                fetchHistory();
              }}
              timeRange={chartTimeRange}
              onTimeRangeChange={(range) => setChartTimeRange(range)}
            />
          </div>