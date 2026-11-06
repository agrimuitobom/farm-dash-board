"""計算（ダッシュボードの src/utils/humidityDeficit.js と同じ式）"""
import math


def humidity_deficit(temperature, humidity):
    """飽差（g/m³、小数1桁）。温度・湿度が無ければ None

    飽和水蒸気圧 e(hPa) = 6.1078 × 10^(7.5T / (T + 237.3))（Tetens の式）
    飽和水蒸気量(g/m³)  = 217 × e / (T + 273.15)
    飽差(g/m³)          = 飽和水蒸気量 × (1 − 湿度 / 100)
    """
    if not isinstance(temperature, (int, float)) or not isinstance(humidity, (int, float)):
        return None
    if math.isnan(temperature) or math.isnan(humidity):
        return None
    rh = min(100.0, max(0.0, humidity))
    e = 6.1078 * math.pow(10, 7.5 * temperature / (temperature + 237.3))
    amount = 217 * e / (temperature + 273.15)
    return round(amount * (1 - rh / 100), 1)


def summarize(values, digits=1):
    """平均・最高・最低（値が無ければ None）"""
    nums = [v for v in values if isinstance(v, (int, float))]
    if not nums:
        return None
    return {"avg": round(sum(nums) / len(nums), digits), "max": round(max(nums), digits), "min": round(min(nums), digits)}
