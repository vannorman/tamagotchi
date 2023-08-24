import json
import numpy as np
from noise import pnoise2, snoise2

def generate_perlin_noise(width, height, scale = .05, octaves=1, persistence=0.5, lacunarity=2.0):
    world = np.zeros(height * width)

    for i in range(height):
        for j in range(width):
            val = pnoise2(i*scale, 
              j*scale, 
              octaves=octaves, 
              persistence=persistence, 
              lacunarity=lacunarity)
            world[i * height + j] = round(val,4) # 4 decimals
    return world

def generate_perlin_noise_2d_array(width, height, scale = 0.1, octaves=1, persistence=0.5, lacunarity=2.0):
    world = np.zeros((height, width))

    for i in range(height):
        for j in range(width):
            world[i][j] = pnoise2(i*scale, 
                                  j*scale, 
                                  octaves=octaves, 
                                  persistence=persistence, 
                                  lacunarity=lacunarity)
    return world

class NumpyEncoder(json.JSONEncoder):
    """ Special json encoder for numpy types """
    def default(self, obj):
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
                            np.int16, np.int32, np.int64, np.uint8,
                            np.uint16, np.uint32, np.uint64)):
            return int(obj)
        elif isinstance(obj, (np.float_, np.float16, np.float32,
                              np.float64)):
            return float(obj)
        elif isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)
