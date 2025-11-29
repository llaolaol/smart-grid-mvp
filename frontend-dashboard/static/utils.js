// Chart Manager
class ChartManager {
    constructor() {
        this.charts = new Map();
        this.originalData = new Map();
    }

    initChart(containerId, chartType = 'line') {
        const chart = echarts.init(document.getElementById(containerId));
        this.charts.set(containerId, chart);
        return chart;
    }

    getChart(containerId) {
        return this.charts.get(containerId);
    }

    resizeChart(containerId) {
        const chart = this.charts.get(containerId);
        if (chart && chart.resize) {
            chart.resize();
        }
    }

    disposeChart(containerId) {
        const chart = this.charts.get(containerId);
        if (chart && chart.dispose) {
            chart.dispose();
        }
        this.charts.delete(containerId);
    }

    setOriginalData(key, data) {
        this.originalData.set(key, JSON.parse(JSON.stringify(data)));
    }

    getOriginalData(key) {
        return this.originalData.get(key);
    }

    clearAll() {
        this.charts.forEach(chart => {
            if (chart && chart.dispose) {
                chart.dispose();
            }
        });
        this.charts.clear();
        this.originalData.clear();
    }
}

// Data Loader
class DataLoader {
    constructor(chartManager) {
        this.chartManager = chartManager;
    }

    async loadData(dataType, params) {
        const { startTime, endTime, deviceId, granularity, chartInstance, context = 'single', columnId = null, predictionPoints } = params;

        try {
            const queryParams = this.buildQueryParams({ startTime, endTime, deviceId, granularity, dataType, predictionPoints });
            // Special handling for API endpoints
            let apiEndpoint = `/api/${dataType}_data`;
            if (dataType === 'correlation') {
                apiEndpoint = '/api/correlation_data';
            } else if (dataType === 'prediction') {
                apiEndpoint = '/api/predictions_data';
            } else if (dataType === 'anomaly') {
                apiEndpoint = '/api/anomaly_detection_data';
            } else if (dataType === 'density') {
                apiEndpoint = '/api/density_data';
            }

            const response = await fetch(`${apiEndpoint}?${queryParams}`);
            const data = await response.json();

            // Debug info
            // console.log(`Loading ${dataType} data:`, data);

            if (data.error) {
                if (chartInstance) {
                    this.showErrorChart(chartInstance, data.error);
                } else if (dataType === 'anomaly') {
                    this.displayAnomalyData(data, null, context, columnId);
                }
                return;
            }

            let option = null;
            // Special handling for correlation analysis, anomaly detection, and density chart
            if (dataType === 'correlation') {
                if (chartInstance) {
                    this.drawCorrelationMatrix(data, chartInstance);
                }
            } else if (dataType === 'anomaly') {
                this.displayAnomalyData(data, chartInstance, context, columnId);
            } else if (dataType === 'density') {
                if (chartInstance) {
                    this.drawDensityChart(data, chartInstance, context, columnId);
                }
            } else {
                if (chartInstance) {
                    option = this.createChartOption(dataType, data, context);
                    chartInstance.setOption(option);
                }
            }

            // Save original data for chart type switching
            const dataKey = this.getDataKey(dataType, context, columnId);
            if (dataType !== 'correlation' && dataType !== 'anomaly' && option) {
                this.chartManager.setOriginalData(dataKey, option);
            }

            // Check and apply current chart type (if not line chart)
            if (chartInstance && option) {
                this.applyCurrentChartType(dataType, chartInstance, context, columnId);
            }

            // Resize chart after setting option
            setTimeout(() => {
                if (chartInstance && chartInstance.resize) {
                    chartInstance.resize();
                }
            }, 100);

        } catch (error) {
            console.error(`Error loading ${dataType} data:`, error); // 加载[dataType]数据失败
            if (chartInstance) {
                this.showErrorChart(chartInstance, 'Failed to load data'); // 加载数据失败
            } else if (dataType === 'anomaly') {
                this.displayAnomalyData({ error: 'Failed to load data' }, null, context, columnId); // 加载数据失败
            }
        }
    }

    buildQueryParams(params) {
        const { startTime, endTime, deviceId, granularity, dataType, predictionPoints } = params;
        const queryParams = new URLSearchParams();

        if (deviceId) queryParams.append('device_id', deviceId);
        if (granularity) queryParams.append('granularity', granularity);
        if (startTime) queryParams.append('start_time', startTime);
        if (endTime) queryParams.append('end_time', endTime);

        // Special handling for extra parameters needed by some data types
        if (dataType === 'correlation' || dataType === 'prediction' || dataType === 'anomaly') {
            const year = startTime ? new Date(startTime).getFullYear().toString() : new Date().getFullYear().toString();
            queryParams.append('year', year);
        }

        if (dataType === 'prediction') {
            const predictionType = document.getElementById('predictionTypeSelect')?.value || 'oil_temp';
            queryParams.append('type', predictionType);
            if (predictionPoints) queryParams.append('points', predictionPoints);
        }

        return queryParams.toString();
    }

    getDataKey(dataType, context, columnId) {
        if (context === 'current') {
            return `current_${dataType}`;
        } else if (context === 'column' && columnId) {
            return `column_${columnId}_${dataType}`;
        } else {
            return dataType;
        }
    }

    // Apply current chart type
    applyCurrentChartType(dataType, chartInstance, context, columnId) {
        // Get the value of the current chart type selector
        let selectorId = '';
        if (context === 'single') {
            selectorId = `${dataType}ChartType`;
        } else if (context === 'current') {
            selectorId = `current${dataType.charAt(0).toUpperCase() + dataType.slice(1)}ChartType`;
        } else if (context === 'column' && columnId) {
            selectorId = `${dataType}ChartType_${columnId}`;
        }

        const selector = document.getElementById(selectorId);
        if (selector) {
            const currentType = selector.value;
            const currentOption = chartInstance.getOption();

            // If the current chart type is not a line chart, apply it immediately
            if (currentType && currentType !== 'line' && currentOption && currentOption.series) {
                // console.log(`Immediately applying ${dataType} chart type: ${currentType}`); // 立即应用 [dataType] 图表类型

                // Use the chart type switcher to apply the correct type
                if (dataType === 'operation') {
                    chartTypeSwitcher.switchOperationChartType(chartInstance, currentOption, currentType, dataType, columnId, context);
                } else if (dataType === 'status') {
                    chartTypeSwitcher.switchStatusChartType(chartInstance, currentOption, currentType, dataType, columnId, context);
                } else if (dataType === 'chromatography') {
                    chartTypeSwitcher.switchChromatographyChartType(chartInstance, currentOption, currentType, dataType, columnId, context);
                } else if (dataType === 'density') {
                    chartTypeSwitcher.switchDensityChartType(chartInstance, currentOption, currentType, dataType, columnId, context);
                }
            }
        }
    }

    showErrorChart(chartInstance, errorMessage) {
        if (!chartInstance) return;

        const option = {
            title: {
                text: 'No Data', // 无数据
                left: 'center',
                top: 'middle',
                textStyle: { color: '#999' }
            },
            graphic: {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                    text: errorMessage,
                    fontSize: 16,
                    fill: '#e74c3c'
                }
            }
        };
        chartInstance.setOption(option);
    }

    createChartOption(dataType, data, context) {
        const baseConfig = this.getBaseChartConfig(dataType);
        const dataConfig = this.getDataSpecificConfig(dataType, data);

        return { ...baseConfig, ...dataConfig };
    }

    getBaseChartConfig(dataType) {
        const titles = {
            operation: 'Operation Data', // 运行数据
            status: 'Status Data', // 状态数据
            chromatography: 'Oil Chromatography Data', // 油色谱数据
            weather: 'Weather Data', // 天气数据
            correlation: 'Correlation Analysis', // 相关性分析
            prediction: 'Time Series Prediction Analysis', // 时序预测分析
            anomaly: 'Anomaly Detection' // 异常检测
        };

        return {
            title: {
                text: titles[dataType] || 'Data', // 数据
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'item',
                axisPointer: { type: 'cross' }
            },
            legend: {
                top: 30,
                type: 'scroll'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '15%',
                containLabel: true
            }
        };
    }

    getDataSpecificConfig(dataType, data) {
        switch (dataType) {
            case 'operation':
                return this.createOperationConfig(data);
            case 'status':
                return this.createStatusConfig(data);
            case 'chromatography':
                return this.createChromatographyConfig(data);
            case 'weather':
                return this.createWeatherConfig(data);
            case 'correlation':
                return this.createCorrelationConfig(data);
            case 'prediction':
                return this.createPredictionConfig(data);
            case 'anomaly':
                return this.createAnomalyConfig(data);
            default:
                return {};
        }
    }

    createOperationConfig(data) {
        if (!data.time || data.time.length === 0 || !data.series) {
            return { graphic: { type: 'text', left: 'center', top: 'middle', style: { text: 'No Available Data', fontSize: 16, fill: '#7f8c8d' } } }; // 无可用数据
        }

        const option = {
            tooltip: {
                formatter: function (params) {
                    // Safety check params object
                    if (!params || !params.seriesName) return '';

                    const time = params.dataIndex < data.time.length ? data.time[params.dataIndex] : '';
                    let unit = '';
                    if (params.seriesName.includes('电流')) unit = 'A'; // 电流
                    else if (params.seriesName.includes('功率')) unit = 'MW'; // 功率
                    return `${params.seriesName.replace('相电流', ' Current (Phase)').replace('相功率', ' Power (Phase)')}<br/>Time: ${time}<br/>Value: ${params.data} ${unit}`; // A相电流 -> A Current (Phase), A相功率 -> A Power (Phase)
                }
            },
            legend: {
                data: ['A Phase Current', 'B Phase Current', 'C Phase Current', 'A Phase Power', 'B Phase Power', 'C Phase Power'], // A相电流, B相电流, C相电流, A相功率, B相功率, C相功率
                top: 30
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: {
                            zoom: 'Area Zoom', // 区域缩放
                            back: 'Restore Area Zoom' // 区域缩放还原
                        }
                    },
                    dataView: {
                        show: true,
                        title: 'Data View', // 数据视图
                        readOnly: false,
                        lang: ['Data View', 'Close', 'Refresh'], // 数据视图, 关闭, 刷新
                        optionToContent: function (opt) {
                            let result = '<div style="padding: 10px; font-family: monospace; font-size: 12px;">';
                            result += '<h4>Operation Data Table</h4>'; // 运行数据表
                            result += '<table border="1" style="border-collapse: collapse; width: 100%;">';

                            // Table header
                            result += '<tr><th>Time</th>'; // 时间
                            result += '<th>A Current (A)</th><th>B Current (A)</th><th>C Current (A)</th>'; // A相电流(A), B相电流(A), C相电流(A)
                            result += '<th>A Power (MW)</th><th>B Power (MW)</th><th>C Power (MW)</th>'; // A相功率(MW), B相功率(MW), C相功率(MW)
                            result += '</tr>';

                            // Data rows
                            const timeData = data.time || [];
                            const seriesData = data.series || {};

                            timeData.forEach((time, index) => {
                                result += `<tr><td>${time}</td>`;

                                // Current data
                                ['A', 'B', 'C'].forEach(phase => {
                                    const currentData = seriesData[phase]?.current || [];
                                    result += `<td>${(currentData[index] || 0).toFixed(2)}</td>`;
                                });

                                // Power data
                                ['A', 'B', 'C'].forEach(phase => {
                                    const powerData = seriesData[phase]?.active_power || [];
                                    result += `<td>${(powerData[index] || 0).toFixed(2)}</td>`;
                                });

                                result += '</tr>';
                            });

                            result += '</table></div>';
                            return result;
                        }
                    },
                    restore: {
                        title: 'Restore' // 还原
                    },
                    saveAsImage: {
                        title: 'Save as Image' // 保存为图片
                    }
                },
                right: 20,
                top: 0
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [0],
                    start: 0,
                    end: 100,
                    left: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [1],
                    start: 0,
                    end: 100,
                    right: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [1],
                    start: 0,
                    end: 100
                }
            ],
            xAxis: {
                type: 'category',
                data: data.time,
                axisLabel: { rotate: 45, fontSize: 10 }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Current (A)', // 电流 (A)
                    position: 'left',
                    scale: true
                },
                {
                    type: 'value',
                    name: 'Power (MW)', // 功率 (MW)
                    position: 'right',
                    scale: true
                }
            ],
            series: []
        };

        const colorScheme = {
            A: { current: operationColorScheme['A相电流'], power: operationColorScheme['A相功率'] },
            B: { current: operationColorScheme['B相电流'], power: operationColorScheme['B相功率'] },
            C: { current: operationColorScheme['C相电流'], power: operationColorScheme['C相功率'] }
        };

        for (const phase of ['A', 'B', 'C']) {
            if (data.series[phase]) {
                option.series.push({
                    name: `${phase} Phase Current`, // A相电流 -> A Phase Current
                    type: 'line',
                    yAxisIndex: 0,
                    data: data.series[phase].current || [],
                    smooth: true,
                    lineStyle: { color: colorScheme[phase].current, width: 2 },
                    itemStyle: { color: colorScheme[phase].current }
                });
                option.series.push({
                    name: `${phase} Phase Power`, // A相功率 -> A Phase Power
                    type: 'line',
                    yAxisIndex: 1,
                    data: data.series[phase].active_power || [],
                    smooth: true,
                    lineStyle: { color: colorScheme[phase].power, type: 'dashed', width: 2 },
                    itemStyle: { color: colorScheme[phase].power }
                });
            }
        }

        return option;
    }

    createStatusConfig(data) {
        if (!data || Object.keys(data).length === 0) {
            return { graphic: { type: 'text', left: 'center', top: 'middle', style: { text: 'No Available Data', fontSize: 16, fill: '#7f8c8d' } } }; // 无可用数据
        }

        // Get time data, prioritize oil_temperature time
        const timeData = data.oil_temperature ? data.oil_temperature.time :
            data.oil_level ? data.oil_level.time :
                data.winding_temperature ? data.winding_temperature.time : [];

        const option = {
            tooltip: {
                formatter: function (params) {
                    // Safety check params object
                    if (!params || !params.seriesName) return '';

                    const time = params.dataIndex < timeData.length ? timeData[params.dataIndex] : '';
                    let unit = '';
                    if (params.seriesName.includes('温度')) unit = '℃'; // 温度
                    else if (params.seriesName.includes('油位')) unit = 'm'; // 油位
                    return `${params.seriesName.replace('油温点位1', 'Oil Temp Point 1').replace('油温点位2', 'Oil Temp Point 2').replace('油位', 'Oil Level').replace('绕组温度', 'Winding Temp')}<br/>Time: ${time}<br/>Value: ${params.data} ${unit}`; // 油温点位1, 油温点位2, 油位, 绕组温度
                }
            },
            legend: {
                data: ['Oil Temp Point 1', 'Oil Temp Point 2', 'Oil Level', 'Winding Temp'], // 油温点位1, 油温点位2, 油位, 绕组温度
                top: 30
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: {
                            zoom: 'Area Zoom', // 区域缩放
                            back: 'Restore Area Zoom' // 区域缩放还原
                        }
                    },
                    dataView: {
                        show: true,
                        title: 'Data View', // 数据视图
                        readOnly: false,
                        lang: ['Data View', 'Close', 'Refresh'], // 数据视图, 关闭, 刷新
                        optionToContent: function (opt) {
                            let result = '<div style="padding: 10px; font-family: monospace; font-size: 12px;">';
                            result += '<h4>Status Data Table</h4>'; // 状态数据表
                            result += '<table border="1" style="border-collapse: collapse; width: 100%;">';

                            // Table header
                            result += '<tr><th>Time</th>'; // 时间
                            result += '<th>Oil Temp Point 1 (℃)</th><th>Oil Temp Point 2 (℃)</th>'; // 油温点位1(℃), 油温点位2(℃)
                            result += '<th>Oil Level (m)</th><th>Winding Temp (℃)</th>'; // 油位(m), 绕组温度(℃)
                            result += '</tr>';

                            // Data rows
                            timeData.forEach((time, index) => {
                                result += `<tr><td>${time}</td>`;

                                // Oil Temp Point 1
                                const oilTemp1Data = data.oil_temperature?.point1 || [];
                                result += `<td>${(oilTemp1Data[index] || 0).toFixed(2)}</td>`;

                                // Oil Temp Point 2
                                const oilTemp2Data = data.oil_temperature?.point2 || [];
                                result += `<td>${(oilTemp2Data[index] || 0).toFixed(2)}</td>`;

                                // Oil Level
                                const oilLevelData = data.oil_level?.level || [];
                                result += `<td>${(oilLevelData[index] || 0).toFixed(2)}</td>`;

                                // Winding Temp
                                const windingTempData = data.winding_temperature?.temperature || [];
                                result += `<td>${(windingTempData[index] || 0).toFixed(2)}</td>`;

                                result += '</tr>';
                            });

                            result += '</table></div>';
                            return result;
                        }
                    },
                    restore: {
                        title: 'Restore' // 还原
                    },
                    saveAsImage: {
                        title: 'Save as Image' // 保存为图片
                    }
                },
                right: 20,
                top: 0
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [0],
                    start: 0,
                    end: 100,
                    left: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [1],
                    start: 0,
                    end: 100,
                    right: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [1],
                    start: 0,
                    end: 100
                }
            ],
            xAxis: {
                type: 'category',
                data: timeData,
                axisLabel: { rotate: 45, fontSize: 10 }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Temperature (℃)', // 温度 (℃)
                    position: 'left',
                    scale: true
                },
                {
                    type: 'value',
                    name: 'Oil Level', // 油位
                    position: 'right',
                    scale: true
                }
            ],
            series: []
        };

        const statusColors = {
            oilTemp1: '#e74c3c',
            oilTemp2: '#f39c12',
            oilLevel: '#27ae60',
            windingTemp: '#8e44ad'
        };

        if (data.oil_temperature) {
            option.series.push({
                name: 'Oil Temp Point 1', // 油温点位1
                type: 'line',
                yAxisIndex: 0,
                data: data.oil_temperature.point1 || [],
                smooth: true,
                lineStyle: { color: statusColors.oilTemp1, width: 2 },
                itemStyle: { color: statusColors.oilTemp1 }
            });
            option.series.push({
                name: 'Oil Temp Point 2', // 油温点位2
                type: 'line',
                yAxisIndex: 0,
                data: data.oil_temperature.point2 || [],
                smooth: true,
                lineStyle: { color: statusColors.oilTemp2, width: 2 },
                itemStyle: { color: statusColors.oilTemp2 }
            });
        }

        if (data.oil_level) {
            option.series.push({
                name: 'Oil Level', // 油位
                type: 'line',
                yAxisIndex: 1,
                data: data.oil_level.level || [],
                smooth: true,
                lineStyle: { color: statusColors.oilLevel, width: 2 },
                itemStyle: { color: statusColors.oilLevel }
            });
        }

        if (data.winding_temperature) {
            option.series.push({
                name: 'Winding Temp', // 绕组温度
                type: 'line',
                yAxisIndex: 0,
                data: data.winding_temperature.temperature || [],
                smooth: true,
                lineStyle: { color: statusColors.windingTemp, width: 2 },
                itemStyle: { color: statusColors.windingTemp }
            });
        }

        return option;
    }

    createChromatographyConfig(data) {
        if (!data.time || data.time.length === 0) {
            return { graphic: { type: 'text', left: 'center', top: 'middle', style: { text: 'No Available Data', fontSize: 16, fill: '#7f8c8d' } } }; // 无可用数据
        }

        const legendData = [];
        const series = [];
        const selectedData = [];

        const phases = ['Phase A', 'Phase B', 'Phase C']; // A相, B相, C相
        const gases = ['Hydrogen', 'Methane', 'Ethane', 'Ethylene', 'Acetylene', 'Carbon Monoxide', 'Carbon Dioxide', 'Total Hydrocarbons']; // 氢气, 甲烷, 乙烷, 乙烯, 乙炔, 一氧化碳, 二氧化碳, 总烃 (Simplified to English)
        const gasKeys = ['氢气', '甲烷', '乙烷', '乙烯', '乙炔', '一氧化碳', '二氧化碳', '总烃']; // Use original keys for data fetching

        phases.forEach((phase, phaseIndex) => {
            gasKeys.forEach((gasKey, gasIndex) => {
                const phase_zh = ['A相', 'B相', 'C相'][phaseIndex];
                const gas_en = gases[gasIndex];
                const seriesName = `${phase_zh.replace('相', ' Phase')}${gas_en}`;
                const key = `${phase_zh}_${gasKey}`;
                const maxKey = `${phase_zh}_${gasKey}_max`;

                if (data[key] && data[key].length > 0) {
                    const maxConcentration = data[maxKey] || 0;
                    const isSelected = maxConcentration < 100;

                    legendData.push(seriesName); // A Phase Hydrogen

                    const color = chromatographyColorScheme[phase_zh][gasIndex];

                    series.push({
                        name: seriesName,
                        type: 'line',
                        data: data[key],
                        smooth: true,
                        lineStyle: { color: color, width: 2, opacity: 1.0 },
                        itemStyle: { color: color }
                    });

                    selectedData.push({
                        name: seriesName,
                        selected: isSelected
                    });
                }
            });
        });

        return {
            tooltip: {
                formatter: function (params) {
                    // Safety check params object
                    if (!params || !params.seriesName) return '';

                    const time = params.dataIndex < data.time.length ? data.time[params.dataIndex] : '';
                    return `${params.seriesName}<br/>Time: ${time}<br/>Concentration: ${params.data} μL/L`; // 浓度
                }
            },
            legend: {
                data: legendData,
                top: 30,
                type: 'scroll',
                orient: 'horizontal',
                selected: selectedData.reduce((acc, item) => {
                    acc[item.name] = item.selected;
                    return acc;
                }, {})
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: {
                            zoom: 'Area Zoom', // 区域缩放
                            back: 'Restore Area Zoom' // 区域缩放还原
                        }
                    },
                    dataView: {
                        show: true,
                        title: 'Data View', // 数据视图
                        readOnly: false,
                        lang: ['Data View', 'Close', 'Refresh'], // 数据视图, 关闭, 刷新
                        optionToContent: function (opt) {
                            let result = '<div style="padding: 10px; font-family: monospace; font-size: 12px;">';
                            result += '<h4>Oil Chromatography Data Table (μL/L)</h4>'; // 油色谱数据表 (μL/L)
                            result += '<table border="1" style="border-collapse: collapse; width: 100%;">';

                            // Table header
                            result += '<tr><th>Time</th>'; // 时间
                            const phases_zh = ['A相', 'B相', 'C相'];
                            const gases_zh = ['氢气', '甲烷', '乙烷', '乙烯', '乙炔', '一氧化碳', '二氧化碳', '总烃'];

                            phases_zh.forEach(phase => {
                                gases_zh.forEach(gas => {
                                    result += `<th>${phase.replace('相', ' Phase')}${gas}</th>`;
                                });
                            });
                            result += '</tr>';

                            // Data rows
                            const timeData = data.time || [];
                            timeData.forEach((time, index) => {
                                result += `<tr><td>${time}</td>`;

                                phases_zh.forEach(phase => {
                                    gases_zh.forEach(gas => {
                                        const key = `${phase}_${gas}`;
                                        const gasData = data[key] || [];
                                        result += `<td>${(gasData[index] || 0).toFixed(2)}</td>`;
                                    });
                                });

                                result += '</tr>';
                            });

                            result += '</table></div>';
                            return result;
                        }
                    },
                    restore: {
                        title: 'Restore' // 还原
                    },
                    saveAsImage: {
                        title: 'Save as Image' // 保存为图片
                    }
                },
                right: 20,
                top: 0
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [0],
                    start: 0,
                    end: 100,
                    right: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [0],
                    start: 0,
                    end: 100
                }
            ],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: data.time,
                axisLabel: { rotate: 45, fontSize: 10 }
            },
            yAxis: {
                type: 'value',
                name: 'Concentration (μL/L)', // 浓度 (μL/L)
                scale: true
            },
            series: series
        };
    }

    createWeatherConfig(data) {
        if (!data.time || data.time.length === 0) {
            return { graphic: { type: 'text', left: 'center', top: 'middle', style: { text: 'No Available Data', fontSize: 16, fill: '#7f8c8d' } } }; // 无可用数据
        }

        return {
            tooltip: {
                formatter: function (params) {
                    // Safety check params object
                    if (!params || !params.seriesName) return '';

                    const time = params.dataIndex < data.time.length ? data.time[params.dataIndex] : '';
                    let unit = '';
                    if (params.seriesName.includes('气温')) unit = '℃'; // 气温
                    else if (params.seriesName.includes('风速')) unit = 'm/s'; // 风速
                    return `${params.seriesName.replace('气温', 'Temperature').replace('风速', 'Wind Speed')}<br/>Time: ${time}<br/>Value: ${params.data} ${unit}`;
                }
            },
            legend: {
                data: ['Temperature', 'Wind Speed'], // 气温, 风速
                top: 30
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: {
                            zoom: 'Area Zoom', // 区域缩放
                            back: 'Restore Area Zoom' // 区域缩放还原
                        }
                    },
                    dataView: {
                        show: true,
                        title: 'Data View', // 数据视图
                        readOnly: false,
                        lang: ['Data View', 'Close', 'Refresh'], // 数据视图, 关闭, 刷新
                        optionToContent: function (opt) {
                            let result = '<div style="padding: 10px; font-family: monospace; font-size: 12px;">';
                            result += '<h4>Weather and Environment Data Table</h4>'; // 天气环境数据表
                            result += '<table border="1" style="border-collapse: collapse; width: 100%;">';

                            // Table header
                            result += '<tr><th>Time</th>'; // 时间
                            result += '<th>Temperature (℃)</th><th>Wind Speed (m/s)</th>'; // 气温(℃), 风速(m/s)
                            result += '</tr>';

                            // Data rows
                            const timeData = data.time || [];
                            timeData.forEach((time, index) => {
                                result += `<tr><td>${time}</td>`;

                                // Temperature
                                const tempData = data.temperature || [];
                                result += `<td>${(tempData[index] || 0).toFixed(2)}</td>`;

                                // Wind Speed
                                const windData = data.wind_speed || [];
                                result += `<td>${(windData[index] || 0).toFixed(2)}</td>`;

                                result += '</tr>';
                            });

                            result += '</table></div>';
                            return result;
                        }
                    },
                    restore: {
                        title: 'Restore' // 还原
                    },
                    saveAsImage: {
                        title: 'Save as Image' // 保存为图片
                    }
                },
                right: 20,
                top: 0
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [0],
                    start: 0,
                    end: 100,
                    left: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [1],
                    start: 0,
                    end: 100,
                    right: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [1],
                    start: 0,
                    end: 100
                }
            ],
            xAxis: {
                type: 'category',
                data: data.time,
                axisLabel: { rotate: 45, fontSize: 10 }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Temperature (℃)', // 气温 (℃)
                    position: 'left',
                    scale: true
                },
                {
                    type: 'value',
                    name: 'Wind Speed (m/s)', // 风速 (m/s)
                    position: 'right',
                    scale: true
                }
            ],
            series: [
                {
                    name: 'Temperature', // 气温
                    type: 'line',
                    yAxisIndex: 0,
                    data: data.temperature || [],
                    smooth: true,
                    lineStyle: { color: '#e74c3c', width: 2 },
                    itemStyle: { color: '#e74c3c' }
                },
                {
                    name: 'Wind Speed', // 风速
                    type: 'line',
                    yAxisIndex: 1,
                    data: data.wind_speed || [],
                    smooth: true,
                    lineStyle: { color: '#27ae60', width: 2 },
                    itemStyle: { color: '#27ae60' }
                }
            ]
        };
    }

    createCorrelationConfig(data) {
        // Correlation data uses a special heatmap display
        return this.createCorrelationHeatmap(data);
    }

    createPredictionConfig(data) {
        const typeNames = {
            'oil_temp': 'Oil Temperature', // 油温
            'oil_level': 'Oil Level', // 油位
            'winding_temp': 'Winding Temperature', // 绕组温度
            'power': 'Power', // 功率
            'current': 'Current' // 电流
        };

        const typeName = typeNames[data.prediction_type] || 'Data'; // 数据
        const unit = data.unit || '';

        return {
            tooltip: {
                formatter: function (params) {
                    // Safety check params object
                    if (!params || !params.seriesName) return '';

                    const allTimes = [...data.historical.time, ...data.predictions.time];
                    const time = params.dataIndex < allTimes.length ? allTimes[params.dataIndex] : '';
                    return `${params.seriesName.replace('历史数据', 'Historical Data').replace('预测数据', 'Predicted Data').replace('置信区间', 'Confidence Interval')}<br/>Time: ${time}<br/>Value: ${params.data} ${unit}`; // 历史数据, 预测数据, 置信区间, 数值
                }
            },
            legend: {
                data: ['Historical Data', 'Predicted Data', 'Confidence Interval'], // 历史数据, 预测数据, 置信区间
                top: 30
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: {
                            zoom: 'Area Zoom', // 区域缩放
                            back: 'Restore Area Zoom' // 区域缩放还原
                        }
                    },
                    dataView: {
                        show: true,
                        title: 'Data View', // 数据视图
                        readOnly: false,
                        lang: ['Data View', 'Close', 'Refresh'], // 数据视图, 关闭, 刷新
                        optionToContent: function (opt) {
                            let result = '<div style="padding: 10px; font-family: monospace; font-size: 12px;">';
                            result += `<h4>Time Series Prediction Data Table (${unit})</h4>`; // 时序预测数据表 (${unit})
                            result += '<table border="1" style="border-collapse: collapse; width: 100%;">';

                            // Table header
                            result += '<tr><th>Time</th>'; // 时间
                            result += '<th>Historical Data</th><th>Predicted Data</th>'; // 历史数据, 预测数据
                            result += '</tr>';

                            // Data rows
                            const allTimes = [...data.historical.time, ...data.predictions.time];
                            const historicalValues = data.historical.values || [];
                            const predictionValues = data.predictions.values || [];

                            allTimes.forEach((time, index) => {
                                result += `<tr><td>${time}</td>`;

                                // Historical Data
                                const histValue = index < historicalValues.length ? historicalValues[index] : '';
                                result += `<td>${histValue !== '' ? histValue.toFixed(2) : '-'}</td>`;

                                // Predicted Data
                                const predIndex = index - historicalValues.length;
                                const predValue = predIndex >= 0 && predIndex < predictionValues.length ? predictionValues[predIndex] : '';
                                result += `<td>${predValue !== '' ? predValue.toFixed(2) : '-'}</td>`;

                                result += '</tr>';
                            });

                            result += '</table>';

                            // Add Prediction Quality Metrics
                            if (data.prediction_quality) {
                                result += '<br/><h4>Prediction Quality Metrics</h4>'; // 预测质量指标
                                result += '<table border="1" style="border-collapse: collapse; width: 100%;">';
                                result += '<tr><th>Metric</th><th>Score</th><th>Description</th></tr>'; // 指标, 评分, 说明

                                const quality = data.prediction_quality;
                                result += `<tr><td>Accuracy Score</td><td>${(quality.accuracy_score * 100).toFixed(1)}%</td><td>Assessment based on historical data stability</td></tr>`; // 准确性评分, 基于历史数据稳定性评估
                                result += `<tr><td>Trend Consistency</td><td>${(quality.trend_consistency * 100).toFixed(1)}%</td><td>Match between predicted trend and historical trend</td></tr>`; // 趋势一致性, 预测趋势与历史趋势的匹配度
                                result += `<tr><td>Volatility Match</td><td>${(quality.volatility_match * 100).toFixed(1)}%</td><td>Match between predicted volatility and historical volatility</td></tr>`; // 波动性匹配, 预测波动性与历史波动性的匹配度

                                const overallScore = (quality.accuracy_score + quality.trend_consistency + quality.volatility_match) / 3;
                                result += `<tr><td><strong>Overall Score</strong></td><td><strong>${(overallScore * 100).toFixed(1)}%</strong></td><td>Comprehensive assessment of prediction quality</td></tr>`; // 综合评分, 预测质量综合评估

                                result += '</table>';
                            }

                            result += '</div>';
                            return result;
                        }
                    },
                    restore: {
                        title: 'Restore' // 还原
                    },
                    saveAsImage: {
                        title: 'Save as Image' // 保存为图片
                    }
                },
                right: 20,
                top: 0
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [0],
                    start: 0,
                    end: 100,
                    left: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [0],
                    start: 0,
                    end: 100
                }
            ],
            xAxis: {
                type: 'category',
                data: [...data.historical.time, ...data.predictions.time],
                axisLabel: { rotate: 45, fontSize: 10 }
            },
            yAxis: {
                type: 'value',
                name: `${typeName} (${unit})`, // [typeName] (${unit})
                scale: true
            },
            series: [
                {
                    name: 'Historical Data', // 历史数据
                    type: 'line',
                    data: [...data.historical.values, ...new Array(data.predictions.values.length).fill(null)],
                    smooth: true,
                    lineStyle: { color: '#3498db', width: 2 },
                    itemStyle: { color: '#3498db' }
                },
                // Yellow line connection: from the last historical data point to the first predicted data point
                {
                    name: 'Connection Line', // 连接线
                    type: 'line',
                    data: (() => {
                        const historicalValues = data.historical.values || [];
                        const predictionValues = data.predictions.values || [];
                        if (historicalValues.length === 0 || predictionValues.length === 0) return [];

                        const lastHistoricalValue = historicalValues[historicalValues.length - 1];
                        const firstPredictionValue = predictionValues[0];

                        const connectionData = new Array(historicalValues.length + predictionValues.length).fill(null);
                        connectionData[historicalValues.length - 1] = lastHistoricalValue;
                        connectionData[historicalValues.length] = firstPredictionValue;

                        return connectionData;
                    })(),
                    lineStyle: { color: '#e67e22', width: 2, type: 'solid' },
                    itemStyle: { color: '#e67e22' },
                    showSymbol: false,
                    silent: true,
                    z: 1
                },
                {
                    name: 'Predicted Data', // 预测数据
                    type: 'line',
                    data: [...new Array(data.historical.values.length).fill(null), ...data.predictions.values],
                    smooth: true,
                    lineStyle: { color: '#e67e22', type: 'dashed', width: 2 },
                    itemStyle: { color: '#e67e22' }
                },
                // Confidence interval upper bound
                {
                    name: 'Confidence Interval Upper', // 置信区间上界
                    type: 'line',
                    data: [...new Array(data.historical.values.length).fill(null), ...(data.predictions.confidence_upper || [])],
                    lineStyle: { color: '#e67e22', type: 'dotted', width: 1, opacity: 0.5 },
                    itemStyle: { color: '#e67e22', opacity: 0.5 },
                    showSymbol: false,
                    silent: true
                },
                // Confidence interval lower bound
                {
                    name: 'Confidence Interval Lower', // 置信区间下界
                    type: 'line',
                    data: [...new Array(data.historical.values.length).fill(null), ...(data.predictions.confidence_lower || [])],
                    lineStyle: { color: '#e67e22', type: 'dotted', width: 1, opacity: 0.5 },
                    itemStyle: { color: '#e67e22', opacity: 0.5 },
                    showSymbol: false,
                    silent: true,
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(230, 126, 34, 0.1)' },
                                { offset: 1, color: 'rgba(230, 126, 34, 0.05)' }
                            ]
                        }
                    }
                }
            ]
        };
    }

    createAnomalyConfig(data) {
        // Anomaly detection data is displayed as a list, not a chart
        return null;
    }

    displayAnomalyData(data, chartInstance, context, columnId) {
        // Get the anomaly detection container
        let containerId;
        if (context === 'current') {
            containerId = 'currentAnomalyList';
        } else if (context === 'column' && columnId) {
            containerId = `anomalyList_${columnId}`;
        } else {
            containerId = 'anomalyList';
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Anomaly detection container not found: ${containerId}`); // 异常检测容器未找到
            return;
        }

        if (data.error) {
            container.innerHTML = `<div class="error">${data.error}</div>`;
            return;
        }

        let html = '';
        if (data.anomalies && data.anomalies.length > 0) {
            // Add anomaly statistics
            html += `
                <div style="background: #f8f9fa; padding: 10px; margin-bottom: 10px; border-radius: 4px; border-left: 4px solid #667eea;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; color: #333;">Anomaly Statistics</span>
                        <span style="color: #666;">Total: ${data.total_count} Anomalies</span>
                    </div>
                    <div style="margin-top: 5px; color: #e74c3c; font-weight: bold;">
                        High Severity: ${data.high_severity_count}
                    </div>
                </div>
            `;
            // 异常统计, 总计, 个异常, 高严重性, 个

            data.anomalies.forEach(anomaly => {
                html += `
                    <div class="anomaly-item ${anomaly.severity}">
                        <div class="anomaly-header">
                            <span class="anomaly-type">${anomaly.type}</span>
                            <span class="anomaly-severity ${anomaly.severity}">${anomaly.severity === 'high' ? 'High' : 'Medium'}</span>
                        </div>
                        <div class="anomaly-time">${anomaly.time}</div>
                        <div class="anomaly-description">${anomaly.description}</div>
                    </div>
                `;
            });
            // 高, 中
        } else {
            html = '<div style="text-align: center; color: #27ae60; padding: 20px;">No anomalies detected</div>'; // 未检测到异常
        }

        container.innerHTML = html;
    }

    createCorrelationHeatmap(data) {
        const variables = data.variables || [];
        const matrix = data.matrix || [];

        if (variables.length === 0 || matrix.length === 0) {
            return { graphic: { type: 'text', left: 'center', top: 'middle', style: { text: 'No Available Data', fontSize: 16, fill: '#7f8c8d' } } }; // 无可用数据
        }

        const heatmapData = [];
        for (let i = 0; i < variables.length; i++) {
            for (let j = 0; j < variables.length; j++) {
                heatmapData.push([j, i, matrix[i][j]]);
            }
        }

        return {
            title: {
                text: 'Correlation Coefficient Matrix', // 相关性系数矩阵
                left: 'center',
                top: '1%',
                textStyle: { fontSize: 16 }
            },
            tooltip: {
                position: 'top',
                formatter: function (params) {
                    const x = variables[params.data[0]];
                    const y = variables[params.data[1]];
                    const value = params.data[2];
                    return `${x} vs ${y}<br/>Correlation: ${value.toFixed(3)}`; // 相关性
                }
            },
            grid: {
                height: '70%',
                top: '15%',
                left: '10%',
                right: '5%'
            },
            xAxis: {
                type: 'category',
                data: variables,
                splitArea: { show: true },
                axisLabel: { rotate: 45, fontSize: 14, interval: 0, margin: 8 }
            },
            yAxis: {
                type: 'category',
                data: variables,
                splitArea: { show: true },
                axisLabel: { fontSize: 14, interval: 0, margin: 8 }
            },
            visualMap: {
                min: -1,
                max: 1,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                top: '5%',
                width: '90%',
                height: 20,
                inRange: {
                    color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
                },
                text: ['High', 'Low'], // 高, 低
                textStyle: { color: '#333', fontSize: 14 }
            },
            series: [{
                name: 'Correlation', // 相关性
                type: 'heatmap',
                data: heatmapData,
                label: {
                    show: true,
                    formatter: function (params) {
                        return params.data[2].toFixed(2);
                    },
                    fontSize: 10
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };
    }

    drawCorrelationMatrix(data, chartInstance) {
        if (!chartInstance) return;

        chartInstance.clear();
        const option = this.createCorrelationHeatmap(data);
        chartInstance.setOption(option);
    }

    drawDensityChart(data, chartInstance, context, columnId) {
        if (!chartInstance) return;

        chartInstance.clear();

        // Get the currently selected chart type and data type
        let chartTypeSelector = '';
        let dataTypeSelector = '';

        if (context === 'single') {
            chartTypeSelector = 'densityChartType';
            dataTypeSelector = 'densityDataType';
        } else if (context === 'current') {
            chartTypeSelector = 'currentDensityChartType';
            dataTypeSelector = 'currentDensityDataType';
        } else if (context === 'column' && columnId) {
            chartTypeSelector = `densityChartType_${columnId}`;
            dataTypeSelector = `densityDataType_${columnId}`;
        }

        const chartType = document.getElementById(chartTypeSelector)?.value || 'line';
        const dataType = document.getElementById(dataTypeSelector)?.value || 'current';

        const option = this.createDensityChartOption(data, chartType, dataType);
        chartInstance.setOption(option);
    }

    createDensityChartOption(data, chartType, dataType) {
        if (!data.phases || Object.keys(data.phases).length === 0) {
            return {
                title: {
                    text: 'Operation Data Density Analysis', // 运行数据密度分析
                    left: 'center',
                    textStyle: { fontSize: 14 }
                },
                graphic: {
                    type: 'text',
                    left: 'center',
                    top: 'middle',
                    style: {
                        text: 'No Available Data', // 无可用数据
                        fontSize: 16,
                        fill: '#7f8c8d'
                    }
                }
            };
        }

        const phases = ['A', 'B', 'C'];
        const colors = ['#5470c6', '#91cc75', '#fac858'];
        const series = [];
        const legendData = [];

        phases.forEach((phase, index) => {
            if (data.phases[phase] && data.phases[phase][dataType]) {
                const phaseData = data.phases[phase][dataType];
                const color = colors[index];
                const dataType_zh = dataType === 'current' ? '电流' : '功率';
                const dataType_en = dataType === 'current' ? 'Current' : 'Power';

                if (chartType === 'line') {
                    // Line chart: display raw data time series
                    series.push({
                        name: `${phase} Phase ${dataType_en}`, // A相电流 -> A Phase Current, A相功率 -> A Phase Power
                        type: 'line',
                        data: phaseData.values,
                        smooth: true,
                        lineStyle: { color: color },
                        itemStyle: { color: color },
                        symbol: 'none'
                    });
                    legendData.push(`${phase} Phase ${dataType_en}`);
                } else if (chartType === 'density') {
                    // Density chart: display density distribution
                    if (phaseData.density && phaseData.density.x && phaseData.density.y) {
                        series.push({
                            name: `${phase} Phase ${dataType_en} Density`, // A相电流密度 -> A Phase Current Density
                            type: 'line',
                            data: phaseData.density.y,
                            smooth: true,
                            lineStyle: { color: color, width: 2 },
                            itemStyle: { color: color },
                            symbol: 'none',
                            areaStyle: {
                                color: {
                                    type: 'linear',
                                    x: 0, y: 0, x2: 0, y2: 1,
                                    colorStops: [
                                        { offset: 0, color: color + '40' },
                                        { offset: 1, color: color + '10' }
                                    ]
                                }
                            }
                        });
                        legendData.push(`${phase} Phase ${dataType_en} Density`);
                    }
                } else if (chartType === 'histogram') {
                    // Histogram: display data distribution
                    if (phaseData.density && phaseData.density.bin_edges) {
                        const binEdges = phaseData.density.bin_edges;
                        const histogramData = [];

                        for (let i = 0; i < binEdges.length - 1; i++) {
                            histogramData.push([
                                binEdges[i],
                                binEdges[i + 1],
                                phaseData.density.y[i] || 0
                            ]);
                        }

                        series.push({
                            name: `${phase} Phase ${dataType_en} Distribution`, // A相电流分布 -> A Phase Current Distribution
                            type: 'bar',
                            data: histogramData,
                            itemStyle: { color: color },
                            barWidth: '80%'
                        });
                        legendData.push(`${phase} Phase ${dataType_en} Distribution`);
                    }
                }
            }
        });

        const yAxisName_line = dataType === 'current' ? 'Current (A)' : 'Power (MW)';
        const yAxisName_density = 'Density';
        const yAxisName = chartType === 'line' ? yAxisName_line : yAxisName_density;
        const titleType = chartType === 'line' ? 'Time Series' : chartType === 'density' ? 'Density' : 'Distribution';

        const option = {
            title: {
                text: `Operation Data ${dataType_en} ${titleType} Analysis`, // 运行数据[dataType_zh][titleType]分析
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    if (chartType === 'line') {
                        return `${params.seriesName}<br/>Value: ${params.data}${dataType === 'current' ? 'A' : 'MW'}`; // 数值
                    } else if (chartType === 'density') {
                        const xIndex = params.dataIndex;
                        const xValue = data.phases[params.seriesName.charAt(0)][dataType].density.x[xIndex];
                        return `${params.seriesName}<br/>Value: ${xValue.toFixed(2)}${dataType === 'current' ? 'A' : 'MW'}<br/>Density: ${params.data.toFixed(4)}`; // 数值, 密度
                    } else if (chartType === 'histogram') {
                        return `${params.seriesName}<br/>Range: [${params.data[0].toFixed(2)}, ${params.data[1].toFixed(2)})${dataType === 'current' ? 'A' : 'MW'}<br/>Frequency: ${params.data[2].toFixed(4)}`; // 区间, 频次
                    }
                    return '';
                }
            },
            legend: {
                data: legendData,
                top: 30,
                type: 'scroll'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '15%',
                containLabel: true
            },
            xAxis: {
                type: chartType === 'line' ? 'category' : 'value',
                data: chartType === 'line' ? data.phases['A']?.[dataType]?.time : undefined,
                name: dataType === 'current' ? 'Current (A)' : 'Power (MW)', // 电流 (A) / 功率 (MW)
                nameLocation: 'middle',
                nameGap: 30
            },
            yAxis: {
                type: 'value',
                name: yAxisName,
                nameLocation: 'middle',
                nameGap: 50
            },
            series: series
        };
        
        // Adjust xAxis for density and histogram where data should be on the X axis
        if (chartType === 'density') {
             option.xAxis.data = data.phases['A']?.[dataType]?.density?.x;
        } else if (chartType === 'histogram') {
             option.xAxis.type = 'category';
             option.xAxis.data = series[0]?.data.map(item => `[${item[0].toFixed(2)}, ${item[1].toFixed(2)})`) || []; // Bin ranges
        }
        
        // For time series (line chart) the Y axis name should reflect the value
        if (chartType === 'line') {
             option.yAxis.name = yAxisName_line;
             option.xAxis.type = 'category';
             option.xAxis.data = data.phases['A']?.[dataType]?.time;
        }
        
        // For histogram, the Y axis name is frequency, which is what the density data is showing (normalized frequency)
        if (chartType === 'histogram') {
             option.yAxis.name = 'Frequency'; // 密度
        }


        return option;
    }
}

// Chart Type Switcher
class ChartTypeSwitcher {
    constructor(chartManager) {
        this.chartManager = chartManager;
    }

    switchChartType(chartName, chartType, context = 'single', columnId = null, dataMode = 'relative') {
        const chartKey = this.getChartKey(chartName, context, columnId);
        const chart = this.chartManager.getChart(chartKey);

        if (!chart) return;

        const currentOption = chart.getOption();
        if (!currentOption || !currentOption.series) return;

        // Special handling for operation data chart type
        if (chartName === 'operation') {
            return this.switchOperationChartType(chart, currentOption, chartType, chartName, columnId, context, dataMode);
        }

        // Special handling for status data chart type
        if (chartName === 'status') {
            return this.switchStatusChartType(chart, currentOption, chartType, chartName, columnId, context);
        }

        // Special handling for chromatography data chart type
        if (chartName === 'chromatography') {
            return this.switchChromatographyChartType(chart, currentOption, chartType, chartName, columnId, context, dataMode);
        }
        
        // Special handling for density chart type (requires reload)
        if (chartName === 'density') {
            return this.switchDensityChartType(chart, currentOption, chartType, chartName, columnId, context);
        }


        // General handling
        return this.applyGenericChartType(chart, currentOption, chartType);
    }

    getChartKey(chartName, context, columnId) {
        if (context === 'current') {
            return `current${chartName.charAt(0).toUpperCase() + chartName.slice(1)}Chart`;
        } else if (context === 'column' && columnId) {
            return `${chartName}Chart_${columnId}`;
        } else {
            return `${chartName}Chart`;
        }
    }

    switchOperationChartType(chart, currentOption, chartType, chartName, columnId, context = 'single', dataMode = 'relative') {
        const dataKey = this.getDataKey(chartName, columnId, context);
        let originalData = this.chartManager.getOriginalData(dataKey);

        if (chartType === 'line') {
            chart.setOption(originalData, true);
        } else if (chartType === 'bar') {
            this.switchToOperationBar(chart, originalData);
        } else if (chartType === 'area') {
            this.switchToOperationArea(chart, originalData, dataMode);
        } else if (chartType === 'pie') {
            this.switchToOperationPie(chart, originalData);
        }
    }

    switchStatusChartType(chart, currentOption, chartType, chartName, columnId, context = 'single') {
        const dataKey = this.getDataKey(chartName, columnId, context);
        let originalData = this.chartManager.getOriginalData(dataKey);

        if (chartType === 'line') {
            // Restore to original line chart
            chart.setOption(originalData, true);
        } else if (chartType === 'histogram') {
            // Switch to histogram
            this.switchToHistogram(chart, originalData, chartName);
        }
    }

    switchChromatographyChartType(chart, currentOption, chartType, chartName, columnId, context = 'single', dataMode = 'relative') {
        const dataKey = this.getDataKey(chartName, columnId, context);
        let originalData = this.chartManager.getOriginalData(dataKey);

        if (chartType === 'line') {
            // Restore to original line chart
            chart.setOption(originalData, true);
        } else if (chartType === 'bar') {
            // Switch to bar chart
            this.switchToChromatographyBar(chart, originalData);
        } else if (chartType === 'area') {
            // Switch to stream chart (river chart)
            this.switchToChromatographyArea(chart, originalData, dataMode);
        } else if (chartType === 'pie') {
            // Switch to pie chart (A, B, C phases)
            this.switchToChromatographyPie(chart, originalData);
        }
    }
    
    switchDensityChartType(chart, currentOption, chartType, chartName, columnId, context = 'single') {
        // Density chart requires reloading data as the visualization type and data type are dynamic
        const dataLoader = new DataLoader(this.chartManager);

        // Get current parameters
        const params = this.getCurrentParams(context, columnId);
        
        // Get data mode (current or single/column)
        let dataTypeSelectorId = '';
        if (context === 'single') {
             dataTypeSelectorId = 'densityDataType';
        } else if (context === 'current') {
             dataTypeSelectorId = 'currentDensityDataType';
        } else if (context === 'column' && columnId) {
             dataTypeSelectorId = `densityDataType_${columnId}`;
        }
        const dataType = document.getElementById(dataTypeSelectorId)?.value || 'current';
        
        // Reload density chart data
        dataLoader.loadData('density', {
            ...params,
            chartInstance: chart,
            context: context,
            columnId: columnId,
            dataType: dataType
        });
    }


    getDataKey(chartName, columnId, context = 'single') {
        if (context === 'current') {
            return `current_${chartName}`;
        } else if (context === 'column' && columnId) {
            return `column_${columnId}_${chartName}`;
        } else {
            return chartName;
        }
    }

    getCurrentParams(context, columnId) {
        // Get current control parameters
        const deviceId = document.getElementById('deviceSelect')?.value || '';
        const granularity = document.getElementById('timeGranularity')?.value || 'hour';

        let startTime = null;
        let endTime = null;

        if (context === 'current') {
            startTime = document.getElementById('currentStartTime')?.value || null;
            endTime = document.getElementById('currentEndTime')?.value || null;
        } else if (context === 'column' && columnId) {
            // For comparison columns, get the time range from the corresponding time selectors
            const startTimeId = `columnStartTime_${columnId}`;
            const endTimeId = `columnEndTime_${columnId}`;
            startTime = document.getElementById(startTimeId)?.value || null;
            endTime = document.getElementById(endTimeId)?.value || null;
        } else {
            // Single time analysis mode
            const year = document.getElementById('yearSelect')?.value || '2024';
            startTime = `${year}-01-01T00:00:00`;
            endTime = `${year}-12-31T23:59:59`;
        }

        return {
            deviceId: deviceId,
            granularity: granularity,
            startTime: startTime,
            endTime: endTime
        };
    }

    switchToBarChart(chart, currentOption, chartName) {
        if (!currentOption.series || currentOption.series.length === 0) return;
        
        // Function to determine the unit based on chart name (or other logic if needed)
        const getUnit = (name) => {
            if (chartName === 'weather') {
                if (name.includes('Temperature')) return '℃'; // 气温
                if (name.includes('Wind Speed')) return 'm/s'; // 风速
            } else if (chartName === 'status') {
                 if (name.includes('Temp')) return '℃'; // 温度
                 if (name.includes('Oil Level')) return 'm'; // 油位
            }
            return '';
        };

        const barData = currentOption.series.map(series => {
            const values = series.data || [];
            const avgValue = values.length > 0 ?
                values.reduce((sum, val) => sum + (val || 0), 0) / values.length : 0;
            return {
                name: series.name.replace('油温点位1', 'Oil Temp Point 1').replace('油温点位2', 'Oil Temp Point 2').replace('油位', 'Oil Level').replace('绕组温度', 'Winding Temp').replace('气温', 'Temperature').replace('风速', 'Wind Speed'), // Translation
                value: avgValue,
                color: series.itemStyle ? series.itemStyle.color : series.lineStyle ? series.lineStyle.color : '#5470c6',
                unit: getUnit(series.name)
            };
        }).filter(item => item.value > 0);

        const barOption = {
            title: {
                text: 'Data Average Comparison', // 数据平均值对比
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                    const dataItem = barData.find(item => item.name === params[0].name);
                    return `${params[0].name}<br/>Average: ${params[0].value.toFixed(2)} ${dataItem ? dataItem.unit : ''}`; // 平均值
                }
            },
            legend: {
                data: barData.map(item => item.name),
                top: 30
            },
            xAxis: {
                type: 'category',
                data: barData.map(item => item.name),
                axisLabel: {
                    rotate: barData.length > 6 ? 45 : 0,
                    fontSize: 10
                }
            },
            yAxis: {
                type: 'value',
                scale: true
            },
            series: [{
                name: 'Average', // 平均值
                type: 'bar',
                data: barData.map(item => ({
                    value: item.value,
                    itemStyle: { color: item.color }
                })),
                barWidth: '60%',
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };

        chart.setOption(barOption, true);
    }

    switchToChromatographyBar(chart, originalData) {
        if (!originalData.series || originalData.series.length === 0) return;

        const barData = originalData.series.map(series => {
            const values = series.data || [];
            const avgValue = values.length > 0 ?
                values.reduce((sum, val) => sum + (val || 0), 0) / values.length : 0;
            return {
                name: series.name.replace('相', ' Phase'), // Translation
                value: avgValue,
                color: series.itemStyle ? series.itemStyle.color : series.lineStyle ? series.lineStyle.color : '#5470c6'
            };
        }).filter(item => item.value > 0);

        const barOption = {
            title: {
                text: 'Oil Chromatography Data Average Comparison', // 油色谱数据平均值对比
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                    // Safety check params array
                    if (!params || params.length === 0) return '';

                    const time = params[0] && params[0].axisValue ? params[0].axisValue : '';
                    let result = `Time: ${time}<br/>`; // 时间
                    params.forEach(param => {
                        if (param && param.seriesName) {
                            result += `${param.seriesName}: ${param.value || 0} μL/L<br/>`; // Use μL/L or ppm based on your backend unit
                        }
                    });
                    return result;
                }
            },
            legend: {
                data: barData.map(item => item.name),
                top: '5%'
            },
            xAxis: {
                type: 'category',
                data: barData.map(item => item.name),
                axisLabel: { rotate: 45, fontSize: 10 }
            },
            yAxis: {
                type: 'value',
                name: 'Concentration (μL/L)', // 浓度 (μL/L) - Assuming μL/L based on original tooltip
                scale: true
            },
            series: [{
                name: 'Average', // 平均值
                type: 'bar',
                data: barData.map(item => ({
                    value: item.value,
                    itemStyle: { color: item.color }
                })),
                barWidth: '60%',
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };

        chart.setOption(barOption, true);
    }

    switchToOperationBar(chart, originalData) {
        // Data validation
        if (!originalData || !originalData.series || !Array.isArray(originalData.series)) {
            console.error('Bar chart data invalid:', originalData); // 柱状图数据无效
            this.showErrorChart(chart, 'Data format error'); // 数据格式错误
            return;
        }

        const currentSeries = originalData.series.filter(series => series.name && series.name.includes('电流')); // 电流
        const powerSeries = originalData.series.filter(series => series.name && series.name.includes('功率')); // 功率

        const currentData = currentSeries.map(series => {
            const values = series.data || [];
            const avgValue = values.length > 0 ?
                values.reduce((sum, val) => sum + (val || 0), 0) / values.length : 0;
            return {
                name: series.name.replace('相电流', ' Phase Current'), // 翻译
                value: avgValue,
                color: operationColorScheme[series.name] || '#5470c6'
            };
        }).filter(item => item.value > 0);

        const powerData = powerSeries.map(series => {
            const values = series.data || [];
            const avgValue = values.length > 0 ?
                values.reduce((sum, val) => sum + (val || 0), 0) / values.length : 0;
            return {
                name: series.name.replace('相功率', ' Phase Power'), // 翻译
                value: avgValue,
                color: operationColorScheme[series.name] || '#5470c6'
            };
        }).filter(item => item.value > 0);

        // Check if there is valid data
        if (currentData.length === 0 && powerData.length === 0) {
            console.warn('No valid data for bar chart'); // 柱状图没有有效数据
            this.showErrorChart(chart, 'No displayable data'); // 没有可显示的数据
            return;
        }

        const option = {
            title: {
                text: 'Operation Data Average Comparison', // 运行数据平均值对比
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                     // Check if data is for current or power and format accordingly
                     const time = params[0]?.name || '';
                     let result = `Time: ${time}<br/>`; 
                     params.forEach(param => {
                         let unit = '';
                         if (param.seriesName.includes('Current')) unit = 'A';
                         else if (param.seriesName.includes('Power')) unit = 'MW';
                         result += `${param.seriesName}: ${param.value.toFixed(2)} ${unit}<br/>`;
                     });
                     return result;
                 }
            },
            legend: {
                data: [...currentData.map(item => item.name), ...powerData.map(item => item.name)],
                top: 30
            },
            grid: [
                {
                    left: '3%',
                    right: '52%',
                    top: '15%',
                    bottom: '3%',
                    containLabel: true
                },
                {
                    left: '52%',
                    right: '3%',
                    top: '15%',
                    bottom: '3%',
                    containLabel: true
                }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: currentData.map(item => item.name),
                    axisLabel: { rotate: 45, fontSize: 10 },
                    gridIndex: 0
                },
                {
                    type: 'category',
                    data: powerData.map(item => item.name),
                    axisLabel: { rotate: 45, fontSize: 10 },
                    gridIndex: 1
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    name: 'Current (A)', // 电流 (A)
                    gridIndex: 0,
                    scale: true
                },
                {
                    type: 'value',
                    name: 'Power (MW)', // 功率 (MW)
                    gridIndex: 1,
                    scale: true
                }
            ],
            series: [
                {
                    name: 'Current Average', // 电流平均值
                    type: 'bar',
                    data: currentData.map(item => ({
                        value: item.value,
                        itemStyle: { color: item.color }
                    })),
                    barWidth: '60%',
                    xAxisIndex: 0,
                    yAxisIndex: 0
                },
                {
                    name: 'Power Average', // 功率平均值
                    type: 'bar',
                    data: powerData.map(item => ({
                        value: item.value,
                        itemStyle: { color: item.color }
                    })),
                    barWidth: '60%',
                    xAxisIndex: 1,
                    yAxisIndex: 1
                }
            ]
        };

        chart.setOption(option, true);
    }

    switchToOperationArea(chart, originalData, dataMode = 'relative') {
        const originalSeries = originalData.series || [];
        const currentSeries = originalSeries.filter(series => series.name.includes('电流')).map(s => ({...s, name: s.name.replace('相电流', ' Phase Current')}));
        const powerSeries = originalSeries.filter(series => series.name.includes('功率')).map(s => ({...s, name: s.name.replace('相功率', ' Phase Power')}));

        // Fix time data retrieval - get time data from xAxis.data
        const rawTimeData = originalData.xAxis && originalData.xAxis.data ? originalData.xAxis.data : [];
        const timeData = rawTimeData;

        // Data transformation function
        const transformData = (data, mode = 'relative') => {
            if (mode === 'original') return data;

            if (mode === 'relative') {
                // Calculate relative change rate (relative to average)
                const validData = data.filter(val => val !== null && val !== undefined && !isNaN(val));
                if (validData.length === 0) return data;

                const average = validData.reduce((sum, val) => sum + val, 0) / validData.length;
                if (average === 0) return data; // Avoid division by zero

                return data.map(val => {
                    if (val === null || val === undefined || isNaN(val)) return 0;
                    return ((val - average) / average) * 100;
                });
            }

            return data;
        };

        const prepareStreamData = (series, transformMode = 'relative') => {
            const sortedSeries = series.sort((a, b) => {
                const order = { 'A Phase': 0, 'B Phase': 1, 'C Phase': 2 };
                const aPhase = a.name.includes('A Phase') ? 'A Phase' : a.name.includes('B Phase') ? 'B Phase' : 'C Phase';
                const bPhase = b.name.includes('A Phase') ? 'A Phase' : b.name.includes('B Phase') ? 'B Phase' : 'C Phase';
                return order[aPhase] - order[bPhase];
            });

            const data = sortedSeries.map((s, index) => {
                const originalData = s.data || [];
                const transformedData = transformData(originalData, transformMode);
                return {
                    original: originalData,
                    transformed: transformedData
                };
            });

            return { data: data, series: sortedSeries };
        };

        const currentStreamResult = prepareStreamData(currentSeries, dataMode);
        const powerStreamResult = prepareStreamData(powerSeries, dataMode);
        const currentStreamData = currentStreamResult.data;
        const powerStreamData = powerStreamResult.data;
        const sortedCurrentSeries = currentStreamResult.series;
        const sortedPowerSeries = powerStreamResult.series;

        // Store original data for toolbox use
        const originalDataForToolbox = {
            current: currentStreamData.map(item => item.original),
            power: powerStreamData.map(item => item.original),
            series: sortedCurrentSeries.concat(sortedPowerSeries)
        };

        const option = {
            title: {
                text: `Operation Data Streamgraph (${dataMode === 'relative' ? 'Relative Change Rate' : 'Original Data'})`, // 运行数据河流图 (相对变化率/原始数据)
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            toolbox: {
                show: true,
                right: 20,
                top: 0,
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: {
                            zoom: 'Area Zoom', // 区域缩放
                            back: 'Restore Area Zoom' // 区域缩放还原
                        }
                    },
                    dataView: {
                        show: true,
                        title: 'Data View', // 数据视图
                        readOnly: false,
                        lang: ['Data View', 'Close', 'Refresh'], // 数据视图, 关闭, 刷新
                        optionToContent: function (opt) {
                            let result = '<div style="padding: 10px; font-family: monospace; font-size: 12px;">';
                            result += '<h4>Original Data Table</h4>'; // 原始数据表
                            result += '<table border="1" style="border-collapse: collapse; width: 100%;">';

                            // Table header
                            result += '<tr><th>Time</th>'; // 时间
                            sortedCurrentSeries.forEach(series => {
                                result += `<th>${series.name.replace(' Phase Current', ' Current (A)')}</th>`; // A Phase Current -> A Current (A)
                            });
                            sortedPowerSeries.forEach(series => {
                                result += `<th>${series.name.replace(' Phase Power', ' Power (MW)')}</th>`; // A Phase Power -> A Power (MW)
                            });
                            result += '</tr>';

                            // Data rows
                            timeData.forEach((time, index) => {
                                result += `<tr><td>${time}</td>`;
                                originalDataForToolbox.current.forEach(data => {
                                    result += `<td>${(data[index] || 0).toFixed(2)}</td>`;
                                });
                                originalDataForToolbox.power.forEach(data => {
                                    result += `<td>${(data[index] || 0).toFixed(2)}</td>`;
                                });
                                result += '</tr>';
                            });

                            result += '</table></div>';
                            return result;
                        }
                    },
                    restore: {
                        show: true,
                        title: 'Restore' // 还原
                    },
                    saveAsImage: {
                        show: true,
                        title: 'Save as Image' // 保存为图片
                    }
                }
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0, 1],
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: [0, 1],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [0],
                    start: 0,
                    end: 100,
                    left: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [1],
                    start: 0,
                    end: 100,
                    right: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [1],
                    start: 0,
                    end: 100
                }
            ],
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: function (params) {
                    // Safety check params array
                    if (!params || params.length === 0) return '';

                    const time = params[0] && params[0].axisValue ? params[0].axisValue : '';
                    const timeIndex = timeData.indexOf(time);
                    let result = `Time: ${time}<br/>`; // 时间
                    if (dataMode === 'relative') {
                        result += '<div style="border-top: 1px solid #ccc; margin-top: 5px; padding-top: 5px;">';
                        result += '<strong>Relative Change Rate (%)</strong><br/>'; // 相对变化率 (%)

                        params.forEach(param => {
                            if (param && param.seriesName) {
                                const seriesIndex = sortedCurrentSeries.findIndex(s => s.name === param.seriesName);
                                let originalValue = 0;
                                let unit = '';

                                if (seriesIndex >= 0) {
                                    originalValue = originalDataForToolbox.current[seriesIndex][timeIndex] || 0;
                                    unit = 'A';
                                } else {
                                    const powerIndex = sortedPowerSeries.findIndex(s => s.name === param.seriesName);
                                    if (powerIndex >= 0) {
                                        originalValue = originalDataForToolbox.power[powerIndex][timeIndex] || 0;
                                        unit = 'MW';
                                    }
                                }

                                result += `${param.seriesName}: ${(param.data || 0).toFixed(2)}% (Original: ${originalValue.toFixed(2)} ${unit})<br/>`; // 原始值
                            }
                        });
                    } else {
                        params.forEach(param => {
                            if (param && param.seriesName) {
                                let unit = '';
                                if (param.seriesName.includes('Current')) unit = 'A'; // 电流
                                else if (param.seriesName.includes('Power')) unit = 'MW'; // 功率
                                result += `${param.seriesName}: ${(param.data || 0).toFixed(2)} ${unit}<br/>`;
                            }
                        });
                    }

                    result += '</div>';
                    return result;
                }
            },
            legend: {
                data: [...sortedCurrentSeries.map(s => s.name), ...sortedPowerSeries.map(s => s.name)],
                top: 30
            },
            grid: [
                {
                    left: '3%',
                    right: '4%',
                    top: '15%',
                    bottom: '55%',
                    containLabel: true
                },
                {
                    left: '3%',
                    right: '4%',
                    top: '55%',
                    bottom: '8%',
                    containLabel: true
                }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: timeData,
                    gridIndex: 0,
                    axisLabel: {
                        rotate: 45,
                        fontSize: 10,
                        show: false
                    },
                    axisLine: { show: false },
                    axisTick: { show: false }
                },
                {
                    type: 'category',
                    data: timeData,
                    gridIndex: 1,
                    axisLabel: {
                        rotate: 45,
                        fontSize: 10
                    },
                    position: 'bottom'
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    name: dataMode === 'relative' ? 'Current Relative Change Rate (%)' : 'Current (A)', // 电流相对变化率 (%) / 电流 (A)
                    gridIndex: 0,
                    position: 'left',
                    axisLabel: {
                        formatter: dataMode === 'relative' ? '{value}%' : '{value}'
                    }
                },
                {
                    type: 'value',
                    name: dataMode === 'relative' ? 'Power Relative Change Rate (%)' : 'Power (MW)', // 功率相对变化率 (%) / 功率 (MW)
                    gridIndex: 1,
                    position: 'left',
                    axisLabel: {
                        formatter: dataMode === 'relative' ? '{value}%' : '{value}'
                    }
                }
            ],
            series: [
                // Current Series - Use stacked area chart for stream effect
                ...sortedCurrentSeries.map((series, index) => ({
                    name: series.name,
                    type: 'line',
                    stack: 'Current Stack', // 电流堆叠
                    data: currentStreamData[index] ? (dataMode === 'relative' ? currentStreamData[index].transformed : currentStreamData[index].original) : [],
                    smooth: true,
                    areaStyle: {
                        opacity: 0.6,
                        color: operationColorScheme[series.name.replace(' Phase Current', '相电流')] || '#5470c6'
                    },
                    lineStyle: {
                        width: 1,
                        color: operationColorScheme[series.name.replace(' Phase Current', '相电流')] || '#5470c6'
                    },
                    itemStyle: {
                        color: operationColorScheme[series.name.replace(' Phase Current', '相电流')] || '#5470c6'
                    },
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    z: index
                })),
                // Power Series - Use stacked area chart for stream effect
                ...sortedPowerSeries.map((series, index) => ({
                    name: series.name,
                    type: 'line',
                    stack: 'Power Stack', // 功率堆叠
                    data: powerStreamData[index] ? (dataMode === 'relative' ? powerStreamData[index].transformed : powerStreamData[index].original) : [],
                    smooth: true,
                    areaStyle: {
                        opacity: 0.6,
                        color: operationColorScheme[series.name.replace(' Phase Power', '相功率')] || '#5470c6'
                    },
                    lineStyle: {
                        width: 1,
                        color: operationColorScheme[series.name.replace(' Phase Power', '相功率')] || '#5470c6'
                    },
                    itemStyle: {
                        color: operationColorScheme[series.name.replace(' Phase Power', '相功率')] || '#5470c6'
                    },
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    z: index
                }))
            ]
        };

        chart.setOption(option, true);
    }

    switchToOperationPie(chart, originalData) {
        const currentSeries = originalData.series.filter(series => series.name.includes('电流')); // 电流
        const powerSeries = originalData.series.filter(series => series.name.includes('功率')); // 功率

        const currentData = currentSeries.map(series => {
            const values = series.data || [];
            const totalValue = values.reduce((sum, val) => sum + (val || 0), 0);
            return {
                name: series.name.replace('相电流', ' Phase Current'), // 翻译
                value: totalValue,
                color: operationColorScheme[series.name] || '#5470c6'
            };
        }).filter(item => item.value > 0);

        const powerData = powerSeries.map(series => {
            const values = series.data || [];
            const totalValue = values.reduce((sum, val) => sum + (val || 0), 0);
            return {
                name: series.name.replace('相功率', ' Phase Power'), // 翻译
                value: totalValue,
                color: operationColorScheme[series.name] || '#5470c6'
            };
        }).filter(item => item.value > 0);

        const option = {
            title: {
                text: 'Operation Data Distribution (Total)', // 运行数据分布（总和）
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                data: [...currentData.map(item => item.name), ...powerData.map(item => item.name)],
                top: 30
            },
            series: [
                {
                    name: 'Current Distribution (Total)', // 电流分布（总和）
                    type: 'pie',
                    radius: '30%',
                    center: ['25%', '60%'],
                    data: currentData.map(item => ({
                        name: item.name,
                        value: item.value,
                        itemStyle: { color: item.color }
                    })),
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                },
                {
                    name: 'Power Distribution (Total)', // 功率分布（总和）
                    type: 'pie',
                    radius: '30%',
                    center: ['75%', '60%'],
                    data: powerData.map(item => ({
                        name: item.name,
                        value: item.value,
                        itemStyle: { color: item.color }
                    })),
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        chart.setOption(option, true);
    }

    switchToChromatographyArea(chart, originalData, dataMode = 'relative') {
        if (!originalData.series || originalData.series.length === 0) return;

        // Group by A, B, C phases
        const phaseASeries = originalData.series.filter(series => series.name.includes('A相')).map(s => ({...s, name: s.name.replace('相', ' Phase')})); // A相
        const phaseBSeries = originalData.series.filter(series => series.name.includes('B相')).map(s => ({...s, name: s.name.replace('相', ' Phase')})); // B相
        const phaseCSeries = originalData.series.filter(series => series.name.includes('C相')).map(s => ({...s, name: s.name.replace('相', ' Phase')})); // C相

        // Get time data
        const timeData = originalData.xAxis ? originalData.xAxis.data : [];

        // Data transformation function
        const transformData = (data, mode = 'relative') => {
            if (mode === 'original') return data;

            if (mode === 'relative') {
                // Calculate relative change rate (relative to average)
                const validData = data.filter(val => val !== null && val !== undefined && !isNaN(val));
                if (validData.length === 0) return data;

                const average = validData.reduce((sum, val) => sum + val, 0) / validData.length;
                if (average === 0) return data; // Avoid division by zero

                return data.map(val => {
                    if (val === null || val === undefined || isNaN(val)) return 0;
                    return ((val - average) / average) * 100;
                });
            }

            return data;
        };

        // Create stream graph data for each phase
        const createStreamData = (seriesList, transformMode = 'relative') => {
            return seriesList.map(series => {
                const values = series.data || [];
                const originalValues = values.map(val => val || 0);
                const transformedValues = transformData(originalValues, transformMode);
                return {
                    original: originalValues,
                    transformed: transformedValues
                };
            });
        };

        const phaseAStreamData = createStreamData(phaseASeries, dataMode);
        const phaseBStreamData = createStreamData(phaseBSeries, dataMode);
        const phaseCStreamData = createStreamData(phaseCSeries, dataMode);

        // Store original data for toolbox use
        const originalDataForToolbox = {
            phaseA: phaseAStreamData.map(item => item.original),
            phaseB: phaseBStreamData.map(item => item.original),
            phaseC: phaseCStreamData.map(item => item.original),
            series: phaseASeries.concat(phaseBSeries, phaseCSeries)
        };

        const option = {
            title: {
                text: `Oil Chromatography Data Streamgraph (${dataMode === 'relative' ? 'Relative Change Rate' : 'Original Data'})`, // 油色谱数据河流图 (相对变化率/原始数据)
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            toolbox: {
                show: true,
                right: 20,
                top: 0,
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: {
                            zoom: 'Area Zoom', // 区域缩放
                            back: 'Restore Area Zoom' // 区域缩放还原
                        }
                    },
                    dataView: {
                        show: true,
                        title: 'Data View', // 数据视图
                        readOnly: false,
                        lang: ['Data View', 'Close', 'Refresh'], // 数据视图, 关闭, 刷新
                        optionToContent: function (opt) {
                            let result = '<div style="padding: 10px; font-family: monospace; font-size: 12px;">';
                            result += '<h4>Original Data Table (μL/L)</h4>'; // 原始数据表 (ppm)
                            result += '<table border="1" style="border-collapse: collapse; width: 100%;">';

                            // Table header
                            result += '<tr><th>Time</th>'; // 时间
                            phaseASeries.forEach(series => {
                                result += `<th>${series.name.replace(' Phase', '')}</th>`; // A Phase Hydrogen -> A Hydrogen
                            });
                            phaseBSeries.forEach(series => {
                                result += `<th>${series.name.replace(' Phase', '')}</th>`;
                            });
                            phaseCSeries.forEach(series => {
                                result += `<th>${series.name.replace(' Phase', '')}</th>`;
                            });
                            result += '</tr>';

                            // Data rows
                            timeData.forEach((time, index) => {
                                result += `<tr><td>${time}</td>`;
                                originalDataForToolbox.phaseA.forEach(data => {
                                    result += `<td>${(data[index] || 0).toFixed(2)}</td>`;
                                });
                                originalDataForToolbox.phaseB.forEach(data => {
                                    result += `<td>${(data[index] || 0).toFixed(2)}</td>`;
                                });
                                originalDataForToolbox.phaseC.forEach(data => {
                                    result += `<td>${(data[index] || 0).toFixed(2)}</td>`;
                                });
                                result += '</tr>';
                            });

                            result += '</table></div>';
                            return result;
                        }
                    },
                    restore: {
                        show: true,
                        title: 'Restore' // 还原
                    },
                    saveAsImage: {
                        show: true,
                        title: 'Save as Image' // 保存为图片
                    }
                }
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0, 1, 2],
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: [0, 1, 2],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [0],
                    start: 0,
                    end: 100,
                    left: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [1],
                    start: 0,
                    end: 100,
                    left: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [1],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: [2],
                    start: 0,
                    end: 100,
                    left: 0,
                    width: 20,
                    handleStyle: {
                        color: '#1890ff'
                    },
                    textStyle: {
                        color: '#666'
                    }
                },
                {
                    type: 'inside',
                    yAxisIndex: [2],
                    start: 0,
                    end: 100
                }
            ],
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    // Safety check params array
                    if (!params || params.length === 0) return '';

                    const time = params[0] && params[0].axisValue ? params[0].axisValue : '';
                    const timeIndex = timeData.indexOf(time);
                    let result = `Time: ${time}<br/>`; // 时间
                    if (dataMode === 'relative') {
                        result += '<div style="border-top: 1px solid #ccc; margin-top: 5px; padding-top: 5px;">';
                        result += '<strong>Relative Change Rate (%)</strong><br/>'; // 相对变化率 (%)

                        params.forEach(param => {
                            if (param && param.seriesName) {
                                let originalValue = 0;
                                let seriesIndex = -1;

                                // Find the corresponding original data
                                if (param.seriesName.includes('A Phase')) { // A相
                                    seriesIndex = phaseASeries.findIndex(s => s.name === param.seriesName);
                                    if (seriesIndex >= 0) {
                                        originalValue = originalDataForToolbox.phaseA[seriesIndex][timeIndex] || 0;
                                    }
                                } else if (param.seriesName.includes('B Phase')) { // B相
                                    seriesIndex = phaseBSeries.findIndex(s => s.name === param.seriesName);
                                    if (seriesIndex >= 0) {
                                        originalValue = originalDataForToolbox.phaseB[seriesIndex][timeIndex] || 0;
                                    }
                                } else if (param.seriesName.includes('C Phase')) { // C相
                                    seriesIndex = phaseCSeries.findIndex(s => s.name === param.seriesName);
                                    if (seriesIndex >= 0) {
                                        originalValue = originalDataForToolbox.phaseC[seriesIndex][timeIndex] || 0;
                                    }
                                }

                                result += `${param.seriesName}: ${(param.value || 0).toFixed(2)}% (Original: ${originalValue.toFixed(2)} μL/L)<br/>`; // 原始值
                            }
                        });
                    } else {
                        params.forEach(param => {
                            if (param && param.seriesName) {
                                result += `${param.seriesName}: ${(param.value || 0).toFixed(2)} μL/L<br/>`;
                            }
                        });
                    }

                    result += '</div>';
                    return result;
                }
            },
            legend: {
                data: [...phaseASeries.map(s => s.name), ...phaseBSeries.map(s => s.name), ...phaseCSeries.map(s => s.name)],
                top: 30,
                type: 'scroll',
                orient: 'horizontal',
                selected: [...phaseASeries, ...phaseBSeries, ...phaseCSeries].reduce((acc, series) => {
                    acc[series.name] = true;
                    return acc;
                }, {})
            },
            grid: [
                { left: '5%', right: '5%', top: '15%', height: '25%' },
                { left: '5%', right: '5%', top: '45%', height: '25%' },
                { left: '5%', right: '5%', top: '75%', height: '25%' }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: timeData,
                    gridIndex: 0,
                    axisLabel: { rotate: 45, fontSize: 10, show: false },
                    axisLine: { show: false },
                    axisTick: { show: false }
                },
                {
                    type: 'category',
                    data: timeData,
                    gridIndex: 1,
                    axisLabel: { rotate: 45, fontSize: 10, show: false },
                    axisLine: { show: false },
                    axisTick: { show: false }
                },
                {
                    type: 'category',
                    data: timeData,
                    gridIndex: 2,
                    axisLabel: { rotate: 45, fontSize: 10 }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    name: dataMode === 'relative' ? 'A Phase Relative Change Rate (%)' : 'A Phase Concentration (μL/L)', // A相相对变化率 (%) / A相浓度 (ppm)
                    gridIndex: 0,
                    position: 'left',
                    axisLabel: {
                        formatter: dataMode === 'relative' ? '{value}%' : '{value}'
                    }
                },
                {
                    type: 'value',
                    name: dataMode === 'relative' ? 'B Phase Relative Change Rate (%)' : 'B Phase Concentration (μL/L)', // B相相对变化率 (%) / B相浓度 (ppm)
                    gridIndex: 1,
                    position: 'left',
                    axisLabel: {
                        formatter: dataMode === 'relative' ? '{value}%' : '{value}'
                    }
                },
                {
                    type: 'value',
                    name: dataMode === 'relative' ? 'C Phase Relative Change Rate (%)' : 'C Phase Concentration (μL/L)', // C相相对变化率 (%) / C相浓度 (ppm)
                    gridIndex: 2,
                    position: 'left',
                    axisLabel: {
                        formatter: dataMode === 'relative' ? '{value}%' : '{value}'
                    }
                }
            ],
            series: [
                // A Phase Series
                ...phaseASeries.map((series, index) => ({
                    name: series.name,
                    type: 'line',
                    stack: 'A Phase Stack', // A相堆叠
                    data: phaseAStreamData[index] ? (dataMode === 'relative' ? phaseAStreamData[index].transformed : phaseAStreamData[index].original) : [],
                    smooth: true,
                    areaStyle: {
                        opacity: 0.6,
                        color: series.itemStyle?.color || series.lineStyle?.color || '#e74c3c'
                    },
                    lineStyle: {
                        width: 1,
                        color: series.itemStyle?.color || series.lineStyle?.color || '#e74c3c'
                    },
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    z: index
                })),
                // B Phase Series
                ...phaseBSeries.map((series, index) => ({
                    name: series.name,
                    type: 'line',
                    stack: 'B Phase Stack', // B相堆叠
                    data: phaseBStreamData[index] ? (dataMode === 'relative' ? phaseBStreamData[index].transformed : phaseBStreamData[index].original) : [],
                    smooth: true,
                    areaStyle: {
                        opacity: 0.6,
                        color: series.itemStyle?.color || series.lineStyle?.color || '#f39c12'
                    },
                    lineStyle: {
                        width: 1,
                        color: series.itemStyle?.color || series.lineStyle?.color || '#f39c12'
                    },
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    z: index
                })),
                // C Phase Series
                ...phaseCSeries.map((series, index) => ({
                    name: series.name,
                    type: 'line',
                    stack: 'C Phase Stack', // C相堆叠
                    data: phaseCStreamData[index] ? (dataMode === 'relative' ? phaseCStreamData[index].transformed : phaseCStreamData[index].original) : [],
                    smooth: true,
                    areaStyle: {
                        opacity: 0.6,
                        color: series.itemStyle?.color || series.lineStyle?.color || '#27ae60'
                    },
                    lineStyle: {
                        width: 1,
                        color: series.itemStyle?.color || series.lineStyle?.color || '#27ae60'
                    },
                    xAxisIndex: 2,
                    yAxisIndex: 2,
                    z: index
                }))
            ]
        };

        chart.setOption(option, true);
    }

    switchToChromatographyPie(chart, originalData) {
        if (!originalData.series || originalData.series.length === 0) return;

        // Group by A, B, C phases
        const phaseASeries = originalData.series.filter(series => series.name.includes('A相')); // A相
        const phaseBSeries = originalData.series.filter(series => series.name.includes('B相')); // B相
        const phaseCSeries = originalData.series.filter(series => series.name.includes('C相')); // C相

        // Calculate the total sum for each phase
        const createPhaseData = (seriesList, phaseName) => {
            return seriesList.map(series => {
                const values = series.data || [];
                const totalValue = values.reduce((sum, val) => sum + (val || 0), 0);
                return {
                    name: series.name.replace('相', ' Phase'), // Translation
                    value: totalValue,
                    color: series.itemStyle?.color || series.lineStyle?.color || this.getChromatographyColor(series.name)
                };
            }).filter(item => item.value > 0);
        };

        const phaseAData = createPhaseData(phaseASeries, 'A Phase'); // A相
        const phaseBData = createPhaseData(phaseBSeries, 'B Phase'); // B相
        const phaseCData = createPhaseData(phaseCSeries, 'C Phase'); // C相

        const option = {
            title: {
                text: 'Oil Chromatography Data Distribution (Total)', // 油色谱数据分布（总和）
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} μL/L ({d}%)' // Assuming μL/L
            },
            legend: {
                data: [...phaseAData.map(item => item.name), ...phaseBData.map(item => item.name), ...phaseCData.map(item => item.name)],
                top: 30
            },
            series: [
                {
                    name: 'A Phase Distribution (Total)', // A相分布（总和）
                    type: 'pie',
                    radius: '25%',
                    center: ['20%', '50%'],
                    data: phaseAData.map(item => ({
                        name: item.name,
                        value: item.value,
                        itemStyle: { color: item.color }
                    })),
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                },
                {
                    name: 'B Phase Distribution (Total)', // B相分布（总和）
                    type: 'pie',
                    radius: '25%',
                    center: ['50%', '50%'],
                    data: phaseBData.map(item => ({
                        name: item.name,
                        value: item.value,
                        itemStyle: { color: item.color }
                    })),
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                },
                {
                    name: 'C Phase Distribution (Total)', // C相分布（总和）
                    type: 'pie',
                    radius: '25%',
                    center: ['80%', '50%'],
                    data: phaseCData.map(item => ({
                        name: item.name,
                        value: item.value,
                        itemStyle: { color: item.color }
                    })),
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        chart.setOption(option, true);
    }

    getChromatographyColor(seriesName) {
        const chromatographyColors = {
            'A相': '#e74c3c', // A Phase
            'B相': '#f39c12', // B Phase
            'C相': '#27ae60', // C Phase
            'H2': '#e74c3c',
            'CH4': '#f39c12',
            'C2H6': '#27ae60',
            'C2H4': '#3498db',
            'C2H2': '#9b59b6',
            'CO': '#1abc9c',
            'CO2': '#34495e'
        };

        // Return color based on series name
        for (const [key, color] of Object.entries(chromatographyColors)) {
            if (seriesName.includes(key)) {
                return color;
            }
        }

        // Default color array
        const defaultColors = ['#e74c3c', '#f39c12', '#27ae60', '#3498db', '#9b59b6', '#1abc9c', '#34495e'];
        return defaultColors[seriesName.length % defaultColors.length];
    }

    switchToHistogram(chart, originalData, chartName) {
        if (!originalData.series || originalData.series.length === 0) return;

        // Create a time-series bar chart for status data
        if (chartName === 'status') {
            // Keep the original time axis and data structure, only change the chart type
            const option = {
                ...originalData,
                title: {
                    ...originalData.title,
                    text: 'Status Data Bar Chart (Time-Series)' // 状态数据直方图
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    formatter: function (params) {
                        // Safety check params array
                        if (!params || params.length === 0) return '';

                        const time = params[0] && params[0].axisValue ? params[0].axisValue : '';
                        let result = `Time: ${time}<br/>`; // 时间
                        params.forEach(param => {
                            if (param && param.seriesName) {
                                let unit = '';
                                if (param.seriesName.includes('温度')) unit = '℃'; // 温度
                                else if (param.seriesName.includes('油位')) unit = 'm'; // 油位
                                result += `${param.seriesName.replace('油温点位1', 'Oil Temp Point 1').replace('油温点位2', 'Oil Temp Point 2').replace('油位', 'Oil Level').replace('绕组温度', 'Winding Temp')}: ${param.value || 0}${unit}<br/>`; // 翻译
                            }
                        });
                        return result;
                    }
                },
                legend: {
                    data: originalData.series.map(s => s.name.replace('油温点位1', 'Oil Temp Point 1').replace('油温点位2', 'Oil Temp Point 2').replace('油位', 'Oil Level').replace('绕组温度', 'Winding Temp')), // 翻译
                    top: '5%'
                },
                xAxis: {
                    ...originalData.xAxis,
                    // Keep original x-axis configuration, do not force to category
                    axisLabel: {
                        ...originalData.xAxis.axisLabel,
                        rotate: 45,
                        fontSize: 10
                    }
                },
                yAxis: originalData.yAxis || [{
                    type: 'value',
                    name: 'Temperature (℃)', // 温度(℃)
                    position: 'left',
                    scale: true
                }, {
                    type: 'value',
                    name: 'Oil Level', // 油位
                    position: 'right',
                    scale: true
                }],
                series: originalData.series.map(series => ({
                    ...series,
                    type: 'bar',
                    barWidth: '40%',
                    itemStyle: {
                        ...series.itemStyle,
                        color: series.itemStyle?.color || series.lineStyle?.color || this.getStatusColor(series.name)
                    }
                }))
            };

            chart.setOption(option, true);
        } else {
            // For other data types, use generic bar chart handling (averages or totals)
            this.switchToBarChart(chart, originalData, chartName);
        }
    }

    getStatusColor(seriesName) {
        const statusColors = {
            '油温点位1': '#e74c3c', // Oil Temp Point 1
            '油温点位2': '#f39c12', // Oil Temp Point 2
            '油位': '#27ae60', // Oil Level
            '绕组温度': '#8e44ad' // Winding Temp
        };

        // If it's an index number, use the default color array
        if (typeof seriesName === 'number') {
            const colors = ['#e74c3c', '#f39c12', '#27ae60', '#8e44ad', '#3498db'];
            return colors[seriesName % colors.length];
        }

        // Return the corresponding color based on the series name
        return statusColors[seriesName] || '#3498db';
    }

    applyGenericChartType(chart, currentOption, chartType) {
        const newOption = { ...currentOption };
        newOption.series = newOption.series.map(series => ({
            ...series,
            type: chartType === 'bar' ? 'bar' : chartType,
            areaStyle: chartType === 'area' ? {} : undefined,
            barWidth: chartType === 'bar' ? '60%' : undefined
        }));

        chart.setOption(newOption, true);
    }

    // Show Error Chart
    showErrorChart(chart, errorMessage) {
        if (!chart) return;

        const option = {
            graphic: {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                    text: errorMessage || 'Data loading failed', // 数据加载失败
                    fontSize: 16,
                    fill: '#7f8c8d'
                }
            }
        };

        chart.setOption(option, true);
    }
}

// Global instances
const chartManager = new ChartManager();
const dataLoader = new DataLoader(chartManager);
const chartTypeSwitcher = new ChartTypeSwitcher(chartManager);

// Compatibility variables
let operationChart, statusChart, chromatographyChart, weatherChart, predictionChart, correlationChart, densityChart;
let comparisonCharts = {}; // Stores comparison chart instances
let currentDataCharts = {}; // Stores current data column chart instances
let columnCounter = 0; // Column counter


// Operation Data Unified Color Scheme
const operationColorScheme = {
    'A相电流': '#e74c3c', // A Phase Current
    'B相电流': '#27ae60', // B Phase Current
    'C相电流': '#3498db', // C Phase Current
    'A相功率': '#f1948a', // A Phase Power
    'B相功率': '#82e0aa', // B Phase Power
    'C相功率': '#85c1e9' // C Phase Power
};

// Oil Chromatography Data Unified Color Scheme
const chromatographyColorScheme = {
    'A相': ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935', '#d32f2f', '#c62828'], // A Phase
    'B相': ['#e8f5e8', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32'], // B Phase
    'C相': ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0'], // C Phase
};

// Initialize charts
function initCharts() {
    // Initialize single time analysis charts
    operationChart = chartManager.initChart('operationChart');
    statusChart = chartManager.initChart('statusChart');
    chromatographyChart = chartManager.initChart('chromatographyChart');
    weatherChart = chartManager.initChart('weatherChart');
    predictionChart = chartManager.initChart('predictionChart');
    correlationChart = chartManager.initChart('correlationMatrix');
    // densityChart = chartManager.initChart('densityChart');

    // Initialize current data column charts
    initCurrentDataCharts();

    // Initialize chart type switchers
    initChartTypeSwitchers();

    // Listen for window resize
    window.addEventListener('resize', function () {
        resizeAllCharts();
    });
}

// Initialize current data column charts
function initCurrentDataCharts() {
    // Delay initialization to ensure the container is rendered
    setTimeout(() => {
        currentDataCharts.operation = chartManager.initChart('currentOperationChart');
        currentDataCharts.status = chartManager.initChart('currentStatusChart');
        currentDataCharts.chromatography = chartManager.initChart('currentChromatographyChart');
        currentDataCharts.weather = chartManager.initChart('currentWeatherChart');
        currentDataCharts.correlation = chartManager.initChart('currentCorrelationChart');
        currentDataCharts.prediction = chartManager.initChart('currentPredictionChart');
        // currentDataCharts.density = chartManager.initChart('currentDensityChart');
        // Anomaly detection does not need a chart instance, set to null
        currentDataCharts.anomaly = null;

        // Resize immediately after initialization
        setTimeout(() => {
            Object.values(currentDataCharts).forEach(chart => {
                if (chart && chart.resize) {
                    chart.resize();
                }
            });
        }, 100);
    }, 100);
}

// Initialize chart type switchers
function initChartTypeSwitchers() {
    // Chart type switchers for single time analysis mode
    const chartTypeSelectors = [
        'operationChartType',
        'statusChartType',
        'chromatographyChartType'
    ];

    chartTypeSelectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            selector.addEventListener('change', function () {
                const chartType = this.value;
                const chartName = selectorId.replace('ChartType', '');

                // Show/hide data mode selector
                const dataModeSelector = document.getElementById(chartName + 'DataMode');
                if (dataModeSelector) {
                    if (chartType === 'area') {
                        dataModeSelector.style.display = 'block';
                    } else {
                        dataModeSelector.style.display = 'none';
                    }
                }

                // Get current data mode
                const dataMode = dataModeSelector ? dataModeSelector.value : 'relative';
                switchChartType(chartName, chartType, dataMode);
            });
        }
    });

    // Initialize data mode switchers
    const dataModeSelectors = [
        'operationDataMode',
        'chromatographyDataMode'
    ];

    dataModeSelectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            selector.addEventListener('change', function () {
                const dataMode = this.value;
                const chartName = selectorId.replace('DataMode', '');

                // Redraw streamgraph
                const chartTypeSelector = document.getElementById(chartName + 'ChartType');
                if (chartTypeSelector && chartTypeSelector.value === 'area') {
                    switchChartType(chartName, 'area', dataMode);
                }
            });
        }
    });

    // Chart type switchers for current data column
    const currentChartTypeSelectors = [
        'currentOperationChartType',
        'currentStatusChartType',
        'currentChromatographyChartType'
    ];

    currentChartTypeSelectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            selector.addEventListener('change', function () {
                const chartType = this.value;
                const chartName = selectorId.replace('current', '').replace('ChartType', '').toLowerCase();

                // Show/hide data mode selector
                const dataModeSelector = document.getElementById('current' + chartName.charAt(0).toUpperCase() + chartName.slice(1) + 'DataMode');
                if (dataModeSelector) {
                    if (chartType === 'area') {
                        dataModeSelector.style.display = 'block';
                    } else {
                        dataModeSelector.style.display = 'none';
                    }
                }

                // Get current data mode
                const dataMode = dataModeSelector ? dataModeSelector.value : 'relative';
                switchCurrentChartType(chartName, chartType, dataMode);
            });
        }
    });

    // Initialize data mode switchers for comparison analysis panel
    const currentDataModeSelectors = [
        'currentOperationDataMode',
        'currentChromatographyDataMode'
    ];

    currentDataModeSelectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            selector.addEventListener('change', function () {
                const dataMode = this.value;
                const chartName = selectorId.replace('current', '').replace('DataMode', '').toLowerCase();

                // Redraw streamgraph
                const chartTypeSelector = document.getElementById('current' + chartName.charAt(0).toUpperCase() + chartName.slice(1) + 'ChartType');
                if (chartTypeSelector && chartTypeSelector.value === 'area') {
                    switchCurrentChartType(chartName, 'area', dataMode);
                }
            });
        }
    });
}

// Toggle analysis mode
function toggleAnalysisMode() {
    const singleMode = document.querySelector('input[name="analysisMode"][value="single"]').checked;
    const singlePanels = document.getElementById('singleAnalysisPanels');
    const comparisonPanels = document.getElementById('comparisonAnalysisPanels');
    const singleControls = document.getElementById('singleTimeControls');
    const comparisonControls = document.getElementById('comparisonControls');

    if (singleMode) {
        singlePanels.style.display = 'grid';
        comparisonPanels.style.display = 'none';
        singleControls.style.display = 'flex';
        comparisonControls.style.display = 'none';

        // Force resize of single time analysis charts
        setTimeout(() => {
            resizeAllCharts();
        }, 100);
    } else {
        // Save current settings
        const deviceId = document.getElementById('deviceSelect').value;
        const granularity = document.getElementById('timeGranularity').value;

        singlePanels.style.display = 'none';
        comparisonPanels.style.display = 'block';
        singleControls.style.display = 'none';
        comparisonControls.style.display = 'flex';
        // Delay loading current data column to ensure DOM is updated
        setTimeout(async () => {
            await setCurrentDataTimeRange();
            loadCurrentData();
            // Resize comparison mode charts
            setTimeout(() => {
                resizeAllCharts();
            }, 200);
        }, 200);
    }
}

// Load current data column
async function loadCurrentData() {
    const startTime = document.getElementById('currentStartTime').value;
    const endTime = document.getElementById('currentEndTime').value;
    const deviceId = document.getElementById('deviceSelect').value;
    const granularity = document.getElementById('timeGranularity').value;

    const dataTypes = ['operation', 'status', 'chromatography', 'weather', 'correlation', 'prediction', 'anomaly', 'density'];

    for (const dataType of dataTypes) {
        const chartInstance = currentDataCharts[dataType];
        await dataLoader.loadData(dataType, {
            startTime,
            endTime,
            deviceId,
            granularity,
            chartInstance,
            context: 'current'
        });
    }
}

// Update current data
function updateCurrentData() {
    loadCurrentData();
}

// Update time range selectors
function updateTimeRangeSelectors(columnType, startTime, endTime) {
    try {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        // Ensure time format includes seconds
        const startFormatted = startDate.toISOString().slice(0, 19);
        const endFormatted = endDate.toISOString().slice(0, 19);


        if (columnType === 'current') {
            const startElement = document.getElementById('currentStartTime');
            const endElement = document.getElementById('currentEndTime');

            if (startElement) {
                startElement.value = startFormatted;
                startElement.setAttribute('step', '1');
            }
            if (endElement) {
                endElement.value = endFormatted;
                endElement.setAttribute('step', '1');
            }
        } else {
            // For comparison columns, only update the time range for the specified column
            const columnId = columnType;
            const startElement = document.getElementById(`columnStartTime_${columnId}`);
            const endElement = document.getElementById(`columnEndTime_${columnId}`);

            if (startElement) {
                startElement.value = startFormatted;
                startElement.setAttribute('step', '1');
            }
            if (endElement) {
                endElement.value = endFormatted;
                endElement.setAttribute('step', '1');
            }
        }
    } catch (error) {
        console.error('Failed to update time range selectors:', error); // 更新时间范围选择器失败
    }
}

// Get time range for current data and set default time
async function setCurrentDataTimeRange() {
    try {
        const deviceId = document.getElementById('deviceSelect').value;
        const granularity = document.getElementById('timeGranularity').value;
        const year = document.getElementById('yearSelect').value;

        // Get data range for the current year
        const response = await fetch(`/api/operation_data?device_id=${deviceId}&granularity=${granularity}&year=${year}`);
        const data = await response.json();

        if (data.time && data.time.length > 0) {
            // Set default time range to the first and last data points
            const firstTime = data.time[0];
            const lastTime = data.time[data.time.length - 1];

            const startDate = new Date(firstTime);
            const endDate = new Date(lastTime);

            const startFormatted = startDate.toISOString().slice(0, 19);
            const endFormatted = endDate.toISOString().slice(0, 19);

            document.getElementById('currentStartTime').value = startFormatted;
            document.getElementById('currentEndTime').value = endFormatted;
        }
    } catch (error) {
        console.error('Failed to get time range:', error); // 获取时间范围失败
    }
}

// Add comparison column
function addComparisonColumn() {
    columnCounter++;
    const layout = document.getElementById('comparisonLayout');
    const addBtn = document.querySelector('.add-column-btn');

    // Create new column
    const columnDiv = document.createElement('div');
    columnDiv.className = 'comparison-column';
    columnDiv.id = `comparisonColumn_${columnCounter}`;

    // Get current time range, default to a different year but keep the same month, day, hour, minute, second
    const currentStartTime = document.getElementById('currentStartTime').value;
    const currentEndTime = document.getElementById('currentEndTime').value;
    const currentYear = new Date(currentStartTime).getFullYear();
    // Select a year from the candidate years in the year selector that is not the current year
    const yearSelect = document.getElementById('yearSelect');
    let defaultYear = 2024;
    for (let i = 0; i < yearSelect.options.length; i++) {
        const y = parseInt(yearSelect.options[i].value);
        if (y !== currentYear) {
            defaultYear = y;
            break;
        }
    }

    // Keep the same month, day, hour, minute, second, only change the year
    const currentStartDate = new Date(currentStartTime);
    const currentEndDate = new Date(currentEndTime);

    const defaultStartDate = new Date(currentStartDate);
    defaultStartDate.setFullYear(defaultYear);

    const defaultEndDate = new Date(currentEndDate);
    defaultEndDate.setFullYear(defaultYear);

    const defaultStartTime = defaultStartDate.toISOString().slice(0, 19);
    const defaultEndTime = defaultEndDate.toISOString().slice(0, 19);

    columnDiv.innerHTML = `
                <div class="comparison-column-header">
                    <div class="column-title">Comparison Data ${columnCounter}</div> <div class="time-range-selector">
                        <div class="time-range-item">
                            <label>Start Time:</label> <input type="datetime-local" id="columnStartTime_${columnCounter}" onchange="updateColumnData(${columnCounter})" 
                                        value="${defaultStartTime}" step="1">
                        </div>
                        <div class="time-range-item">
                            <label>End Time:</label> <input type="datetime-local" id="columnEndTime_${columnCounter}" onchange="updateColumnData(${columnCounter})" 
                                        value="${defaultEndTime}" step="1">
                        </div>
                    </div>
                    <button class="column-remove-btn" onclick="removeComparisonColumn(${columnCounter})" title="Remove this column">×</button> </div>
                <div class="comparison-panels">
                    <div class="comparison-panel">
                        <div class="panel-header">
                            Operation Data <div class="chart-type-switcher">
                                <select id="operationChartType_${columnCounter}" class="chart-type-select">
                                    <option value="line">Line Chart</option> <option value="bar">Bar Chart</option> <option value="area">Streamgraph</option> <option value="pie">Pie Chart</option> </select>
                            </div>
                        </div>
                        <div class="panel-content">
                            <div class="chart-container" id="operationChart_${columnCounter}">
                                <div class="loading">Loading...</div> </div>
                        </div>
                    </div>
                    <div class="comparison-panel">
                        <div class="panel-header">
                            Status Data <div class="chart-type-switcher">
                                <select id="statusChartType_${columnCounter}" class="chart-type-select">
                                    <option value="line">Line Chart</option> <option value="histogram">Bar Chart (Time-Series)</option> </select>
                            </div>
                        </div>
                        <div class="panel-content">
                            <div class="chart-container" id="statusChart_${columnCounter}">
                                <div class="loading">Loading...</div> </div>
                        </div>
                    </div>
                    <div class="comparison-panel">
                        <div class="panel-header">
                            Oil Chromatography Data <div class="chart-type-switcher">
                                <select id="chromatographyChartType_${columnCounter}" class="chart-type-select">
                                    <option value="line">Line Chart</option> <option value="bar">Bar Chart (Average)</option> <option value="area">Streamgraph</option> <option value="pie">Pie Chart</option> </select>
                            </div>
                        </div>
                        <div class="panel-content">
                            <div class="chart-container" id="chromatographyChart_${columnCounter}">
                                <div class="loading">No Data Yet</div> </div>
                        </div>
                    </div>
                    <div class="comparison-panel">
                        <div class="panel-header">Weather and Environment Data</div> <div class="panel-content">
                            <div class="chart-container" id="weatherChart_${columnCounter}">
                                <div class="loading">Loading...</div> </div>
                        </div>
                    </div>
                    <div class="comparison-panel correlation-panel">
                        <div class="panel-header">Correlation Analysis</div> <div class="panel-content">
                            <div class="chart-container" id="correlationChart_${columnCounter}">
                                <div class="loading">Loading...</div> </div>
                        </div>
                    </div>
                    <div class="comparison-panel prediction-panel">
                        <div class="panel-header">Time Series Prediction Analysis</div> <div class="panel-content">
                            <div class="chart-container" id="predictionChart_${columnCounter}">
                                <div class="loading">Loading...</div> </div>
                        </div>
                    </div>
                    <div class="comparison-panel anomaly-panel">
                        <div class="panel-header">Anomaly Detection</div> <div class="panel-content">
                            <div class="anomaly-container" id="anomalyList_${columnCounter}">
                                <div class="loading">Loading...</div> </div>
                        </div>
                    </div>
                </div>
            `;

    // Insert the new column before the add button
    layout.insertBefore(columnDiv, addBtn);

    // Initialize charts for the new column
    initColumnCharts(columnCounter);

    // Ensure the newly added time selectors support second precision and load data
    setTimeout(() => {
        const newStartInput = document.getElementById(`columnStartTime_${columnCounter}`);
        const newEndInput = document.getElementById(`columnEndTime_${columnCounter}`);
        if (newStartInput) {
            newStartInput.setAttribute('step', '1');
        }
        if (newEndInput) {
            newEndInput.setAttribute('step', '1');
        }

        // Load data for the new column
        loadColumnData(columnCounter, defaultStartTime, defaultEndTime);
    }, 200);
}

// Initialize column charts
function initColumnCharts(columnId) {
    // Delay initialization to ensure DOM is rendered
    setTimeout(() => {
        comparisonCharts[`operation_${columnId}`] = echarts.init(document.getElementById(`operationChart_${columnId}`));
        comparisonCharts[`status_${columnId}`] = echarts.init(document.getElementById(`statusChart_${columnId}`));
        comparisonCharts[`chromatography_${columnId}`] = echarts.init(document.getElementById(`chromatographyChart_${columnId}`));
        comparisonCharts[`weather_${columnId}`] = echarts.init(document.getElementById(`weatherChart_${columnId}`));
        comparisonCharts[`correlation_${columnId}`] = echarts.init(document.getElementById(`correlationChart_${columnId}`));
        comparisonCharts[`prediction_${columnId}`] = echarts.init(document.getElementById(`predictionChart_${columnId}`));

        // Add event listeners for chart type switchers in dynamically generated columns
        initColumnChartTypeSwitchers(columnId);

        // Resize immediately after initialization
        setTimeout(() => {
            const chartTypes = ['operation', 'status', 'chromatography', 'weather', 'correlation', 'prediction'];
            chartTypes.forEach(type => {
                const chart = comparisonCharts[`${type}_${columnId}`];
                if (chart && chart.resize) {
                    chart.resize();
                }
            });
        }, 100);
    }, 100);
}

// Initialize column chart type switchers
function initColumnChartTypeSwitchers(columnId) {
    const chartTypeSelectors = [
        `operationChartType_${columnId}`,
        `statusChartType_${columnId}`,
        `chromatographyChartType_${columnId}`
    ];

    chartTypeSelectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            selector.addEventListener('change', function () {
                const chartType = this.value;
                const chartName = selectorId.replace(`ChartType_${columnId}`, '');
                switchColumnChartType(columnId, chartName, chartType);
            });
        }
    });
}

// Update column data
function updateColumnData(columnId) {
    const startTime = document.getElementById(`columnStartTime_${columnId}`).value;
    const endTime = document.getElementById(`columnEndTime_${columnId}`).value;
    loadColumnData(columnId, startTime, endTime);
}

// Remove comparison column
function removeComparisonColumn(columnId) {
    const column = document.getElementById(`comparisonColumn_${columnId}`);
    if (column) {
        // Dispose of chart instances
        const chartTypes = ['operation', 'status', 'chromatography', 'weather', 'correlation', 'prediction'];
        chartTypes.forEach(type => {
            const chartKey = `${type}_${columnId}`;
            if (comparisonCharts[chartKey]) {
                comparisonCharts[chartKey].dispose();
                delete comparisonCharts[chartKey];
            }
        });

        // Remove DOM element
        column.remove();
    }
}

// Load column data
async function loadColumnData(columnId, startTime, endTime) {
    const deviceIdElement = document.getElementById('deviceSelect');
    const granularityElement = document.getElementById('timeGranularity');

    let deviceId = '';
    let granularity = 'day';

    if (deviceIdElement) {
        deviceId = deviceIdElement.value || '';
    }
    if (granularityElement) {
        granularity = granularityElement.value || 'day';
    }

    const dataTypes = ['operation', 'status', 'chromatography', 'weather', 'correlation', 'prediction', 'anomaly'];

    for (const dataType of dataTypes) {
        const chartInstance = comparisonCharts[`${dataType}_${columnId}`];
        await dataLoader.loadData(dataType, {
            startTime,
            endTime,
            deviceId,
            granularity,
            chartInstance,
            context: 'column',
            columnId
        });
    }
}

// Load device list
async function loadDevices() {
    try {
        const response = await fetch('/api/devices');
        const devices = await response.json();

        const select = document.getElementById('deviceSelect');
        select.innerHTML = '<option value="">All Devices</option>'; // 全部设备

        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device;
            option.textContent = device;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load device list:', error); // 加载设备列表失败
    }
}

// Load available years
async function loadYears() {
    try {
        const response = await fetch('/api/available_years');
        const years = await response.json();

        const select = document.getElementById('yearSelect');
        select.innerHTML = '';

        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year + ' Year'; // 年
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load year list:', error); // 加载年份列表失败
    }
}

// Load operation data
async function loadOperationData() {
    const deviceId = document.getElementById('deviceSelect').value;
    const granularity = document.getElementById('timeGranularity').value;
    const year = document.getElementById('yearSelect').value;

    await dataLoader.loadData('operation', {
        deviceId,
        granularity,
        year,
        chartInstance: operationChart,
        context: 'single'
    });
}

// Load status data
async function loadStatusData() {
    const deviceId = document.getElementById('deviceSelect').value;
    const granularity = document.getElementById('timeGranularity').value;
    const year = document.getElementById('yearSelect').value;

    await dataLoader.loadData('status', {
        deviceId,
        granularity,
        year,
        chartInstance: statusChart,
        context: 'single'
    });
}

// Load oil chromatography data
async function loadChromatographyData() {
    const deviceId = document.getElementById('deviceSelect').value;
    const granularity = document.getElementById('timeGranularity').value;
    const year = document.getElementById('yearSelect').value;

    await dataLoader.loadData('chromatography', {
        deviceId,
        granularity,
        year,
        chartInstance: chromatographyChart,
        context: 'single'
    });
}

// Load correlation data
async function loadCorrelationData() {
    const deviceId = document.getElementById('deviceSelect').value;
    const granularity = document.getElementById('timeGranularity').value;
    const year = document.getElementById('yearSelect').value;

    await dataLoader.loadData('correlation', {
        deviceId,
        granularity,
        year,
        chartInstance: correlationChart,
        context: 'single'
    });
}

// Draw correlation coefficient matrix
function drawCorrelationMatrix(data, chart) {
    const targetChart = chart || correlationChart;
    if (!targetChart) return;

    targetChart.clear();

    // Create a DataLoader instance to use the unified configuration generation function
    const dataLoader = new DataLoader();
    const option = dataLoader.createCorrelationHeatmap(data);
    targetChart.setOption(option);
}

// Load prediction data
async function loadPredictionData() {
    const deviceId = document.getElementById('deviceSelect').value;
    const granularity = document.getElementById('timeGranularity').value;
    const year = document.getElementById('yearSelect').value;
    const predictionPoints = document.getElementById('predictionPoints').value;

    await dataLoader.loadData('prediction', {
        deviceId,
        granularity,
        year,
        predictionPoints,
        chartInstance: predictionChart,
        context: 'single'
    });
}

// Load density chart data
async function loadDensityData() {
    return
    const deviceId = document.getElementById('deviceSelect').value;
    const granularity = document.getElementById('timeGranularity').value;
    const year = document.getElementById('yearSelect').value;

    await dataLoader.loadData('density', {
        deviceId,
        granularity,
        year,
        chartInstance: densityChart,
        context: 'single'
    });
}

// Load current density chart data
async function loadCurrentDensityData() {
    const deviceId = document.getElementById('deviceSelect').value;
    const granularity = document.getElementById('timeGranularity').value;
    const startTime = document.getElementById('currentStartTime').value;
    const endTime = document.getElementById('currentEndTime').value;

    await dataLoader.loadData('density', {
        deviceId,
        granularity,
        startTime,
        endTime,
        chartInstance: currentDataCharts.density,
        context: 'current'
    });
}

// Load anomaly detection data
async function loadAnomalyData() {
    const deviceId = document.getElementById('deviceSelect').value;
    const granularity = document.getElementById('timeGranularity').value;
    const year = document.getElementById('yearSelect').value;

    await dataLoader.loadData('anomaly', {
        deviceId,
        granularity,
        year,
        chartInstance: null, // Anomaly detection does not use a chart
        context: 'single'
    });
}

// Load weather data
async function loadWeatherData() {
    const deviceId = document.getElementById('deviceSelect').value;
    const granularity = document.getElementById('timeGranularity').value;
    const year = document.getElementById('yearSelect').value;

    await dataLoader.loadData('weather', {
        deviceId,
        granularity,
        year,
        chartInstance: weatherChart,
        context: 'single'
    });
}

// Refresh all data
async function refreshData() {
    const singleMode = document.querySelector('input[name="analysisMode"][value="single"]').checked;

    // Clear original data cache to ensure the latest data is used
    chartManager.originalData.clear();

    if (singleMode) {
        await loadOperationData();
        await loadStatusData();
        await loadChromatographyData();
        await loadWeatherData();
        await loadCorrelationData();
        await loadPredictionData();
        await loadAnomalyData();
        await loadDensityData();
    } else {
        // Refresh current data column
        await loadCurrentData();

        // Refresh all comparison columns
        for (let i = 1; i <= columnCounter; i++) {
            const column = document.getElementById(`comparisonColumn_${i}`);
            if (column) {
                const startTime = document.getElementById(`columnStartTime_${i}`).value;
                const endTime = document.getElementById(`columnEndTime_${i}`).value;
                await loadColumnData(i, startTime, endTime);
            }
        }
    }
}

// Chart type switching function
function switchChartType(chartName, chartType, dataMode = 'relative') {
    chartTypeSwitcher.switchChartType(chartName, chartType, 'single', null, dataMode);
}

// Current data column chart type switching function
function switchCurrentChartType(chartName, chartType, dataMode = 'relative') {
    const chart = currentDataCharts[chartName];
    if (!chart) return;

    const currentOption = chart.getOption();
    if (!currentOption || !currentOption.series) return;

    // Special handling for operation data chart type
    if (chartName === 'operation') {
        return chartTypeSwitcher.switchOperationChartType(chart, currentOption, chartType, chartName, null, 'current', dataMode);
    }

    // Special handling for status data chart type
    if (chartName === 'status') {
        return chartTypeSwitcher.switchStatusChartType(chart, currentOption, chartType, chartName, null, 'current');
    }

    // Special handling for oil chromatography data chart type
    if (chartName === 'chromatography') {
        return chartTypeSwitcher.switchChromatographyChartType(chart, currentOption, chartType, chartName, null, 'current', dataMode);
    }

    // Special handling for density chart
    if (chartName === 'density') {
        return chartTypeSwitcher.switchDensityChartType(chart, currentOption, chartType, chartName, null, 'current');
    }

    // Special handling for histogram
    if (chartType === 'histogram') {
        // For non-status data, the original data must be saved first
        const dataKey = chartTypeSwitcher.getDataKey(chartName, null, 'current');
        let originalData = chartManager.getOriginalData(dataKey);
        return chartTypeSwitcher.switchToHistogram(chart, originalData, chartName);
    }

    // Special handling for bar chart
    if (chartType === 'bar') {
        return chartTypeSwitcher.switchToBarChart(chart, currentOption, chartName);
    }

    // General handling
    return chartTypeSwitcher.applyGenericChartType(chart, currentOption, chartType);
}

// Comparison column chart type switching function
function switchColumnChartType(columnId, chartName, chartType) {
    const chart = comparisonCharts[`${chartName}_${columnId}`];
    if (!chart) return;

    const currentOption = chart.getOption();
    if (!currentOption || !currentOption.series) return;

    // Special handling for operation data chart type
    if (chartName === 'operation') {
        return chartTypeSwitcher.switchOperationChartType(chart, currentOption, chartType, chartName, columnId, 'column');
    }

    // Special handling for status data chart type
    if (chartName === 'status') {
        return chartTypeSwitcher.switchStatusChartType(chart, currentOption, chartType, chartName, columnId, 'column');
    }

    // Special handling for oil chromatography data chart type
    if (chartName === 'chromatography') {
        return chartTypeSwitcher.switchChromatographyChartType(chart, currentOption, chartType, chartName, columnId, 'column');
    }

    // Special handling for histogram
    if (chartType === 'histogram') {
        // For non-status data, the original data must be saved first
        const dataKey = chartTypeSwitcher.getDataKey(chartName, columnId, 'column');
        let originalData = chartManager.getOriginalData(dataKey);
        return chartTypeSwitcher.switchToHistogram(chart, originalData, chartName);
    }

    // Special handling for bar chart
    if (chartType === 'bar') {
        return chartTypeSwitcher.switchToBarChart(chart, currentOption, chartName);
    }

    // General handling
    return chartTypeSwitcher.applyGenericChartType(chart, currentOption, chartType);
}


// Initialize time selectors
function initTimeSelectors() {
    // Set second precision for all existing time selectors
    const timeInputs = document.querySelectorAll('input[type="datetime-local"]');
    timeInputs.forEach(input => {
        // Set second precision
        input.setAttribute('step', '1');

        // Ensure default value includes seconds
        if (input.value) {
            // If the time format does not include seconds, add seconds
            if (!input.value.includes(':') || input.value.split(':').length < 3) {
                if (input.value.includes('T')) {
                    input.value = input.value + ':00';
                } else {
                    input.value = input.value + 'T00:00:00';
                }
            }
        }

        // Add event listener to ensure second precision is maintained when the user inputs
        input.addEventListener('change', function () {
            if (this.value && !this.value.includes(':')) {
                this.value = this.value + ':00';
            }
        });
    });

}

// Initialize after page load
// Resize all charts
function resizeAllCharts() {
    // Resize single time analysis charts
    chartManager.resizeChart('operationChart');
    chartManager.resizeChart('statusChart');
    chartManager.resizeChart('chromatographyChart');
    chartManager.resizeChart('weatherChart');
    chartManager.resizeChart('predictionChart');
    chartManager.resizeChart('correlationMatrix');

    // Resize current data column charts
    Object.values(currentDataCharts).forEach(chart => {
        if (chart && chart.resize) {
            chart.resize();
        }
    });

    // Resize comparison column charts
    Object.values(comparisonCharts).forEach(chart => {
        if (chart && chart.resize) {
            chart.resize();
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialize time selectors
    initTimeSelectors();

    initCharts();
    loadDevices();
    loadYears();
    refreshData();

    // Resize charts after page fully loaded
    setTimeout(() => {
        resizeAllCharts();
    }, 500);

    // Listen for selector changes
    document.getElementById('deviceSelect').addEventListener('change', refreshData);
    document.getElementById('timeGranularity').addEventListener('change', refreshData);
    document.getElementById('yearSelect').addEventListener('change', refreshData);
    document.getElementById('predictionTypeSelect').addEventListener('change', function () {
        const singleMode = document.querySelector('input[name="analysisMode"][value="single"]').checked;
        if (singleMode) {
            loadPredictionData();
        } else {
            refreshData();
        }
    });

    // Listen for prediction points selection change
    document.getElementById('predictionPoints').addEventListener('change', function () {
        const singleMode = document.querySelector('input[name="analysisMode"][value="single"]').checked;
        if (singleMode) {
            loadPredictionData();
        } else {
            refreshData();
        }
    });

    // Listen for density chart type change
    document.getElementById('densityChartType').addEventListener('change', function () {
        const chartType = this.value;
        switchChartType('density', chartType);
    });

    // Listen for density data type change
    document.getElementById('densityDataType').addEventListener('change', function () {
        const dataType = this.value;
        // Reload density chart data
        const singleMode = document.querySelector('input[name="analysisMode"][value="single"]').checked;
        if (singleMode) {
            loadDensityData();
        } else {
            loadCurrentDensityData();
        }
    });

    // Listen for current density chart type change
    document.getElementById('currentDensityChartType').addEventListener('change', function () {
        const chartType = this.value;
        switchCurrentChartType('density', chartType);
    });

    // Listen for current density data type change
    document.getElementById('currentDensityDataType').addEventListener('change', function () {
        const dataType = this.value;
        // Reload current density chart data
        loadCurrentDensityData();
    });

    // Listen for prediction type change, refresh also in comparison mode
    document.getElementById('predictionTypeSelect').addEventListener('change', function () {
        const singleMode = document.querySelector('input[name="analysisMode"][value="single"]').checked;
        if (singleMode) {
            loadPredictionData();
        } else {
            // Refresh prediction data for current data column and all comparison columns
            const currentStartTime = document.getElementById('currentStartTime').value;
            const currentEndTime = document.getElementById('currentEndTime').value;
            loadCurrentPredictionData(
                currentStartTime,
                currentEndTime,
                document.getElementById('deviceSelect').value,
                document.getElementById('timeGranularity').value
            );

            for (let i = 1; i <= columnCounter; i++) {
                const column = document.getElementById(`comparisonColumn_${i}`);
                if (column) {
                    const startTime = document.getElementById(`columnStartTime_${i}`).value;
                    const endTime = document.getElementById(`columnEndTime_${i}`).value;
                    loadColumnPredictionData(i, startTime, endTime, document.getElementById('deviceSelect').value, document.getElementById('timeGranularity').value);
                }
            }
        }
    });
});