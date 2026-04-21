import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import {
  Code2,
  Palette,
  Server,
  Database,
  Globe,
  Layers,
  Figma,
  PenTool,
  Image,
  Sparkles,
  Layout,
  Zap
} from 'lucide-react'

const Skills = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  const developmentSkills = [
    { name: 'React.js', icon: <Code2 size={18} />, level: 'Advanced' },
    { name: 'Node.js', icon: <Server size={18} />, level: 'Advanced' },
    { name: 'Express.js', icon: <Zap size={18} />, level: 'Advanced' },
    { name: 'JavaScript (ES6+)', icon: <Code2 size={18} />, level: 'Advanced' },
    { name: 'REST API Design', icon: <Globe size={18} />, level: 'Advanced' },
    { name: 'HTML5 & CSS3', icon: <Layout size={18} />, level: 'Expert' },
    { name: 'Tailwind CSS', icon: <Layers size={18} />, level: 'Advanced' },
    { name: 'Bootstrap', icon: <Layers size={18} />, level: 'Expert' },
    { name: 'MongoDB', icon: <Database size={18} />, level: 'Intermediate' }
  ]

  const creativeSkills = [
    { name: 'Adobe Photoshop', icon: <Image size={18} />, level: 'Expert' },
    { name: 'Adobe Illustrator', icon: <PenTool size={18} />, level: 'Advanced' },
    { name: 'Figma', icon: <Figma size={18} />, level: 'Advanced' },
    { name: 'CorelDRAW', icon: <Sparkles size={18} />, level: 'Advanced' },
    { name: 'UI/UX Design', icon: <Layout size={18} />, level: 'Advanced' },
    { name: 'Brand Identity', icon: <Palette size={18} />, level: 'Advanced' },
    { name: 'Logo Design', icon: <PenTool size={18} />, level: 'Expert' }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  }

  const skillVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    }
  }

  return (
    <section id="skills" className="section" ref={ref}>
      <div className="section-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Skills</span>
          <h2 className="section-title">My Technical Arsenal</h2>
          <p className="section-description">
            A balanced toolkit for building complete digital solutions
          </p>
        </motion.div>

        <motion.div
          className="skills-grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Development Skills Card */}
          <motion.div className="glass-card skill-card" variants={cardVariants}>
            <div className="skill-card-header">
              <div className="skill-icon">
                <Code2 size={28} />
              </div>
              <div>
                <h3 className="skill-card-title">The Logic</h3>
                <p className="skill-card-subtitle">Development & Engineering</p>
              </div>
            </div>

            <motion.div
              className="skills-list"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              {developmentSkills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  className="skill-item"
                  variants={skillVariants}
                  custom={index}
                >
                  <span className="skill-name">
                    {skill.icon}
                    {skill.name}
                  </span>
                  <span className="skill-level">{skill.level}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Creative Skills Card */}
          <motion.div className="glass-card skill-card creative" variants={cardVariants}>
            <div className="skill-card-header">
              <div className="skill-icon">
                <Palette size={28} />
              </div>
              <div>
                <h3 className="skill-card-title">The Aesthetics</h3>
                <p className="skill-card-subtitle">Design & Creative Tools</p>
              </div>
            </div>

            <motion.div
              className="skills-list"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              {creativeSkills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  className="skill-item"
                  variants={skillVariants}
                  custom={index}
                >
                  <span className="skill-name">
                    {skill.icon}
                    {skill.name}
                  </span>
                  <span className="skill-level">{skill.level}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Skills
