export function buildKdTree(points, depth = 0) {
    const n = points.length;
    if (n === 0) return null;

    const axis = depth % 3; // LAB 공간에서는 3개의 차원 (L, a, b)
    points.sort((a, b) => a[axis] - b[axis]);

    const median = Math.floor(n / 2);

    return {
        point: points[median],
        left: buildKdTree(points.slice(0, median), depth + 1),
        right: buildKdTree(points.slice(median + 1), depth + 1)
    };
}

export function nearest(node, target, depth) {
    if (node === null) return null;

    const axis = depth % 3;
    let nextBranch = null;
    let oppositeBranch = null;

    if (target[axis] < node.point[axis]) {
        nextBranch = node.left;
        oppositeBranch = node.right;
    } else {
        nextBranch = node.right;
        oppositeBranch = node.left;
    }

    const best = closerDistance(
        target,
        nearest(nextBranch, target, depth + 1),
        node.point
    );

    if (distanceSquared(target, best) > Math.pow(target[axis] - node.point[axis], 2)) {
        const possibleBest = closerDistance(
            target,
            nearest(oppositeBranch, target, depth + 1),
            best
        );
        return possibleBest;
    }

    return best;
}

function closerDistance(target, p1, p2) {
    if (p1 === null) return p2;
    if (p2 === null) return p1;

    if (distanceSquared(target, p1) < distanceSquared(target, p2)) {
        return p1;
    }
    return p2;
}

function distanceSquared(point1, point2) {
    return point1.reduce((sum, _, i) => sum + Math.pow(point1[i] - point2[i], 2), 0);
}
