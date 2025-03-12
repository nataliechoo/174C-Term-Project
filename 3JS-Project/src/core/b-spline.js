export function bspline_interpolate(t, degree, points, knots) {

  var num_points = points.length;
  const POINT_DIM = 3; // 3D environment, points must be 3D

  if(degree < 1) 
    throw new Error('Degree cannot be < 1 (Linear spline)');
  if(degree > (num_points-1)) 
    throw new Error('Degree cannot exceed points.length - 1');

  // This is done so that by default, we only make a uniform b-spline.
  if (!knots) {
    var knots = [];
    for (let i = 0; i < num_points + degree + 1; i++) {
      knots[i] = i; // by default do [0,1,2,3,4,5,...]
    }
  } else {
    if(knots.length != num_points + degree + 1) throw new Error('Knot vector length must be (num_points + degree + 1)');
  }

  // bound by degree since spline not well defined past that since each knot needs degree + 1 control points. (not available at ends)
  let min_spline_def = knots[degree];
  let max_spline_def = knots[knots.length - degree - 1]; // -1 to grab index
  // remap t to within well-defined spline
  t = t * (max_spline_def - min_spline_def) + min_spline_def

  if(t < min_spline_def || t > max_spline_def) throw new Error('t went out of bounds');

  // Find spline segment (dont reset value) for current t
  let spline_seg;
  for (spline_seg = degree; spline_seg < (knots.length - degree - 1); spline_seg++) {
    if (t >= knots[spline_seg] && t <= knots[spline_seg + 1]) {
      break;
    }
  }

  var d = points.map(p => [...p]); // Deep copy so we don't modify input points

  // THE FOLLOWING IS DEFINED AS deBoor's ALGORITHM see: https://en.wikipedia.org/wiki/De_Boor%27s_algorithm
  var alpha;
  for (let r = 1; r <= degree + 1; r++) {
    // build level 'r' of interpolation pyramid
    for (let i = spline_seg; i > (spline_seg - degree - 1 + r); i--) {
        alpha = (t - knots[i]) / (knots[i + degree + 1 - r] - knots[i]);

        for (let j = 0; j < POINT_DIM; j++) {
            d[i][j] = (1 - alpha) * d[i - 1][j] + alpha * d[i][j];
        }
    }
  }

  // return computed point
  return d[spline_seg].slice(0, POINT_DIM);

} 