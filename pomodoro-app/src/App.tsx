import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const DURATIONS = [
  { label: '5:00', seconds: 5 * 60 },
  { label: '25:00', seconds: 25 * 60 },
]

const SOUND_OPTIONS = [
  { id: 'calm_harp', label: 'Calm Harp' },
  { id: 'soft_bell', label: 'Soft Bell' },
  { id: 'gentle_choir', label: 'Gentle Choir' },
  { id: 'warm_glow', label: 'Warm Glow' },
  { id: 'quiet_stream', label: 'Quiet Stream' },
]

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function App() {
  const [totalSeconds, setTotalSeconds] = useState(DURATIONS[1].seconds)
  const [remainingSeconds, setRemainingSeconds] = useState(DURATIONS[1].seconds)
  const [lastSetSeconds, setLastSetSeconds] = useState(DURATIONS[1].seconds)
  const [isRunning, setIsRunning] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.6)
  const [dotCount, setDotCount] = useState(1)
  const [soundId, setSoundId] = useState(SOUND_OPTIONS[0].id)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const endTimeRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const pointsRef = useRef<Array<{ x: number; y: number }>>([])

  const progress = useMemo(() => {
    if (totalSeconds === 0) return 0
    return remainingSeconds / totalSeconds
  }, [remainingSeconds, totalSeconds])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.muted = isMuted
      audio.volume = Math.max(0, Math.min(1, volume))
    }
  }, [isMuted, volume])

  useEffect(() => {
    if (!isRunning) {
      setDotCount(1)
      return
    }

    const intervalId = window.setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1)
    }, 500)

    return () => window.clearInterval(intervalId)
  }, [isRunning])

  useEffect(() => {
    if (!isRunning) return

    const tick = () => {
      if (!endTimeRef.current) return
      const diff = endTimeRef.current - Date.now()
      const nextRemaining = Math.max(0, Math.ceil(diff / 1000))
      setRemainingSeconds(nextRemaining)

      if (nextRemaining <= 0) {
        setIsRunning(false)
        endTimeRef.current = null
        const audio = audioRef.current
        if (audio) {
          audio.currentTime = 0
          void audio.play()
        }
      }
    }

    tick()
    const timerId = window.setInterval(tick, 200)
    return () => window.clearInterval(timerId)
  }, [isRunning])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      const spacing = Math.max(18, Math.min(28, window.innerWidth / 30))
      const cols = Math.ceil(window.innerWidth / spacing)
      const rows = Math.ceil(window.innerHeight / spacing)
      const points: Array<{ x: number; y: number }> = []
      const offsetX = (window.innerWidth - cols * spacing) / 2
      const offsetY = (window.innerHeight - rows * spacing) / 2

      for (let row = 0; row <= rows; row += 1) {
        for (let col = 0; col <= cols; col += 1) {
          points.push({
            x: col * spacing + offsetX,
            y: row * spacing + offsetY,
          })
        }
      }
      pointsRef.current = points
    }

    const render = (time: number) => {
      const t = time * 0.001
      const { innerWidth: width, innerHeight: height } = window

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(3, 3, 8, 0.85)'
      ctx.fillRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      const points = pointsRef.current

      for (const point of points) {
        const dx = point.x - centerX
        const dy = point.y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const wave = Math.sin(dist * 0.03 - t * 2.2) * 14
        const ripple = Math.sin((dx + dy) * 0.02 + t * 1.4) * 8
        const z = wave + ripple

        const depth = 220 + z
        const scale = 220 / depth
        const x = centerX + dx * scale
        const y = centerY + dy * scale

        const brightness = Math.min(1, Math.max(0, 0.35 + z / 40))
        const radius = 1.2 + brightness * 1.4
        const alpha = 0.15 + brightness * 0.35

        ctx.beginPath()
        ctx.fillStyle = `rgba(120, 170, 255, ${alpha})`
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animationRef.current = window.requestAnimationFrame(render)
    }

    resize()
    animationRef.current = window.requestAnimationFrame(render)
    window.addEventListener('resize', resize)

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resize)
    }
  }, [])

  const handleSet = (seconds: number) => {
    setTotalSeconds(seconds)
    setRemainingSeconds(seconds)
    setLastSetSeconds(seconds)
    setIsRunning(true)
    endTimeRef.current = Date.now() + seconds * 1000
  }

  const handleStop = () => {
    setIsRunning(false)
    endTimeRef.current = null
    setRemainingSeconds(lastSetSeconds)
    setTotalSeconds(lastSetSeconds)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value) / 100)
  }

  const handleTestSound = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play()
  }

  const radius = 130
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)
  const soundSrc = `${import.meta.env.BASE_URL}assets/audio/${soundId}.wav`

  return (
    <div className="app">
      <canvas className="background-canvas" ref={canvasRef} aria-hidden="true" />
      <main className="timer-panel">
        <p className="subtitle">Pomodoro Timer</p>
        <div className="timer-shell" role="timer" aria-live="polite">
          <svg className="timer-svg" width="300" height="300" viewBox="0 0 300 300">
            <circle className="timer-ring" cx="150" cy="150" r={radius} />
            <circle
              className="timer-progress"
              cx="150"
              cy="150"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="timer-center">
            <span className="timer-status">
              <span className="status-label">Focus</span>
              <span className="status-dots">{isRunning ? '.'.repeat(dotCount) : ''}</span>
            </span>
            <span className="timer-time">{formatTime(remainingSeconds)}</span>
          </div>
        </div>

        <div className="controls">
          {DURATIONS.map((duration) => (
            <button
              key={duration.seconds}
              className="control-button"
              type="button"
              onClick={() => handleSet(duration.seconds)}
            >
              {duration.label}
            </button>
          ))}
          <button className="control-button subtle" type="button" onClick={handleStop}>
            停止
          </button>
          <button className="control-button subtle" type="button" onClick={toggleMute}>
            {isMuted ? '消音' : '音量'}
          </button>
        </div>

        <div className="volume-controls">
          <label className="volume-label" htmlFor="volume-slider">
            Volume {Math.round(volume * 100)}%
          </label>
          <input
            id="volume-slider"
            className="volume-slider"
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={handleVolumeChange}
          />
          <button className="control-button subtle" type="button" onClick={handleTestSound}>
            テスト
          </button>
        </div>

        <div className="sound-controls">
          <label className="volume-label" htmlFor="sound-select">
            End Sound
          </label>
          <select
            id="sound-select"
            className="sound-select"
            value={soundId}
            onChange={(event) => setSoundId(event.target.value)}
          >
            {SOUND_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </main>
      <audio
        ref={audioRef}
        src={soundSrc}
        preload="auto"
      />
    </div>
  )
}

export default App
