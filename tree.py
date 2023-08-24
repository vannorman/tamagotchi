import numpy as np

def create_tree(height, branchings, leaf_size):
    # Define the root of the tree (the trunk)
    vertices = [(0, 0, 0), (0, height, 0)]
    triangles = []

    # Generate the branches
    for i in range(1, branchings + 1):
        # Calculate the height of the branching point
        y = i * height / (branchings + 1)

        # Calculate the number of branches at this level
        branches = 2 ** i

        # Generate the branches
        for j in range(branches):
            # Calculate the angle of the branch
            angle = j * 2 * np.pi / branches

            # Calculate the position of the branch end (a leaf)
            x = np.cos(angle) * leaf_size
            z = np.sin(angle) * leaf_size

            # Add the branch (a line from the trunk to the leaf)
            vertices.append((x, y, z))

            # Add the triangles for the branch (a simple line)
            triangles.append((0, len(vertices) - 1, len(vertices) - 1))

    return vertices, triangles

vertices, triangles = create_tree(10, 3, 1)

for v in vertices:
    print(f"Vertex: {v}")

for t in triangles:
    print(f"Triangle: {t}")

