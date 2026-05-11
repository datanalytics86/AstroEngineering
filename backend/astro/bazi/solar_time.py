import math

def clock_to_solar(clock_hour: int, clock_min: int, longitude: float, tz_offset: float, day_of_year: int):
    """Returns (solar_hour_float, day_shift, total_correction_min)"""
    standard_meridian = tz_offset * 15
    lon_correction = (longitude - standard_meridian) * 4
    B = 2 * math.pi * (day_of_year - 81) / 365
    eot = 9.87 * math.sin(2 * B) - 7.53 * math.cos(B) - 1.5 * math.sin(B)
    total = lon_correction + eot
    solar = clock_hour + clock_min / 60 + total / 60
    day_shift = 0
    if solar >= 24:
        solar -= 24
        day_shift = 1
    if solar < 0:
        solar += 24
        day_shift = -1
    return solar, day_shift, total
