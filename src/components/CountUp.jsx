// Animates a number toward `value` with a spring; `format` turns the number into display text.
import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function CountUp({ value, format }) {
  const mv = useMotionValue(0)                              // start at 0 so the spring animates on mount
  const spring = useSpring(mv, { stiffness: 70, damping: 20 })
  const text = useTransform(spring, v => format(v))
  useEffect(() => { mv.set(value) }, [value, mv])
  return <motion.span className="countup">{text}</motion.span>
}
