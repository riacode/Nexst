
  progress: Animated.AnimatedInterpolation<number>;
  points: { x: number; y: number }[];
  color?: string;
  strokeWidth?: number;
}

// Helper function to create a vertical step path connecting the points
function createStepPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export default function AnimatedGuidingLine({
  progress,
  points,
  color = '#00b4d8',
  strokeWidth = 4,
}: AnimatedGuidingLineProps) {
  const lengthRef = useRef(1); // Default to 1 to avoid undefined
  const animatedStrokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [lengthRef.current, 0],
  });

  // Calculate the path and its length
  const path = createStepPath(points);
  // Path length will be measured by ref

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Path
          d={path}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={typeof lengthRef.current === 'number' ? lengthRef.current : 1}
          strokeDashoffset={animatedStrokeDashoffset as unknown as number}
          ref={ref => {
            if (ref && ref.getTotalLength) {
              lengthRef.current = ref.getTotalLength() || 1;
            }
          }}
        />
      </Svg>
    </View>
  );
}
