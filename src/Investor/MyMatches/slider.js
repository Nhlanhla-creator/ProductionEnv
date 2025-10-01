"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import styles from "./investor-funding.module.css"

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root ref={ref} className={`${styles.sliderRoot} ${className}`} {...props}>
    <SliderPrimitive.Track className={styles.sliderTrack}>
      <SliderPrimitive.Range className={styles.sliderRange} />
    </SliderPrimitive.Track>
    {props.value?.map((_, i) => (
      <SliderPrimitive.Thumb key={i} className={styles.sliderThumb} />
    ))}
  </SliderPrimitive.Root>
))

Slider.displayName = "Slider"

export { Slider }
