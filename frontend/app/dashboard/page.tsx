"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  Timer,
  CheckSquare,
  Calendar,
  BarChart3,
  FolderOpen,
  Users,
  UserCheck,
  Tag,
  ChevronDown,
  Settings,
  DollarSign,
  LogOut,
  Clock,
  TrendingUp,
  Target,
  Play,
  Pause,
  Bell,
  Coffee,
} from "lucide-react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import { Badge } from "@components/ui/badge"
import { NavigationLink } from "@components/navigation-link"
import { ClientsPage } from "@components/clients-page"
import { ReportsPage } from "@components/reports-page"
import { ProjectsPage } from "@components/projects-page"
import { SettingsPage } from "@components/settings-page"
import { CalendarView } from "@components/calendar-view"
import { PomodoroTimer } from "@components/pomodoro-timer"
import { TagsPage } from "@components/tags-page"
import { useAuth } from "@components/auth/auth-context"
import { useRouter } from "next/navigation"
import { fetchPomodoroSessions, PomodoroSession } from "@/utils/pomodoro-api"

// Notification type definitions
export type NotificationType = "deadline" | "task" | "reminder";
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}
// Add global type definition for teamTags
declare global {
  interface Window {
    teamTags: any[]
  }
}

// interface Project {
//   id: string | number;
//   name: string;
//   client?: string;
//   description?: string;
//   status?: string;
//   progress?: number;
//   billableRate?: number;
//   totalHours?: number;
//   billableHours?: number;
//   totalCost?: number;
//   template?: string;
//   createdDate?: string;
//   deadline?: string;
//   isBillable?: boolean;
// }

interface Project {
  id: string | number;
  name: string;
  client?: string | { name: string; [key: string]: any };
  description?: string;
  status?: string;
  progress?: number;
  billableRate?: number;
  totalHours?: number;
  billableHours?: number;
  totalCost?: number;
  template?: string;
  createdDate?: string;
  deadline?: string;
  isBillable?: boolean;
}

interface TimeEntry {
  id: string
  task: string
  project: string | number | { name: string; [key: string]: any }
  duration: number // in seconds
  date: string
  type: "regular" | "pomodoro"
  billable: boolean
  tags?: string[]
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Dashboard />;
}

function Dashboard() {
  // ...existing state declarations...
  // Add a helper to refresh pomodoro sessions
  async function refreshPomodoroSessions() {
    try {
      const pomodorosData = await fetchPomodoroSessions();
      setPomodoroSessions(pomodorosData);
    } catch (err) {
      console.error("Failed to refresh Pomodoro sessions:", err);
    }
  }
  const [currentTask, setCurrentTask] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeNavItem, setActiveNavItem] = useState("Home")
  const [activePage, setActivePage] = useState("TIME TRACKER")
  const [timerMode, setTimerMode] = useState<"regular" | "pomodoro">("regular")
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  

const [projects, setProjects] = useState<Project[]>([])
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [taskNameSuggestions, setTaskNameSuggestions] = useState<string[]>([])
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([])

  const { user, logout } = useAuth()
  const router = useRouter()

  const profileData = {
    name: typeof user?.name === 'string' ? user.name : "User",
    email: typeof user?.email === 'string' ? user.email : "user@example.com",
    avatar: typeof user?.picture === 'string' ? user.picture : "/placeholder.svg?height=32&width=32",
    initials: (() => {
      if (typeof user?.name === 'string') {
        return user.name
          .split(" ")
        .map((n) => n[0])
        .join("")
          .toUpperCase() || "U";
      }
      return "U";
    })(),
  }

  // Initialize global teamTags if it doesn't exist
  useEffect(() => {
    if (typeof window !== "undefined" && !window.teamTags) {
      window.teamTags = [
        {
          id: "1",
          name: "Development",
          color: "bg-blue-500",
          description: "Software development tasks",
        },
        {
          id: "2",
          name: "Design",
          color: "bg-purple-500",
          description: "UI/UX design work",
        },
        {
          id: "3",
          name: "Meeting",
          color: "bg-green-500",
          description: "Team meetings and client calls",
        },
      ]
    }
  }, [])

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTracking && timerMode === "regular") {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, timerMode])

  // Add this useEffect to check for notifications
  // ...existing code...

// Add this useEffect to check for notifications
useEffect(() => {
  console.log('DEBUG: timeEntries', timeEntries);
  console.log('DEBUG: pomodoroSessions', pomodoroSessions);
  console.log('DEBUG: notifications', notifications);
  let didRemove = false;
  const today = new Date().toISOString().split("T")[0];
  const hasRegularToday = timeEntries.some((entry) => entry.date === today);
  const hasPomodoroToday = pomodoroSessions.some((session) => {
    const sessionDate = new Date(session.start_time).toISOString().split("T")[0];
    return sessionDate === today;
  });

  // Remove 'No time tracked today' notification if time is tracked
  if ((hasRegularToday || hasPomodoroToday) && notifications.some((n) => n.type === "task" && n.title === "No time tracked today")) {
    setNotifications((prev) => prev.filter((n) => !(n.type === "task" && n.title === "No time tracked today")));
    didRemove = true;
  }

  // Only run the rest if we didn't just update notifications
  if (!didRemove) {
    let newNotifications: Notification[] = [];
    // Only add if not tracked and not already present
    if (!hasRegularToday && !hasPomodoroToday) {
      const alreadyNotified = notifications.some(
        (n) => n.type === "task" && n.title === "No time tracked today" && !n.read
      );
      if (!alreadyNotified) {
        newNotifications.push({
          id: Date.now().toString(),
          title: "No time tracked today",
          message: "You haven't tracked any time today. Don't forget to log your work!",
          type: "task" as const,
          timestamp: new Date(),
          read: false,
        });
      }
    }

    // Check for incomplete pomodoro sessions
    if (isTracking && timeElapsed > 1800) {
      newNotifications.push({
        id: (Date.now() + 1).toString(),
        title: "Long session detected",
        message: "You've been working for over 30 minutes. Consider taking a break!",
        type: "reminder" as const,
        timestamp: new Date(),
        read: false,
      });
    }

    // --- DEADLINE NOTIFICATIONS ---
    projects.forEach((project) => {
      if (!project.deadline || project.status === "Completed") return;
      
      // Ensure project name is a string
      const projectName = typeof project.name === 'string' ? project.name : 'Unknown Project';
      
      const deadlineDate = new Date(project.deadline);
      const now = new Date();
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // If deadline is within 3 days (including today)
      if (diffDays >= 0 && diffDays <= 3) {
        // Avoid duplicate notifications for the same project and deadline
        const alreadyNotified = notifications.some(
          (n) =>
            n.type === "deadline" &&
            n.title.includes(projectName) &&
            n.message.includes(project.deadline ?? "") &&
            !n.read
        );
        if (!alreadyNotified) {
          newNotifications.push({
            id: `${project.id}-deadline-${project.deadline}`,
            title: `Project deadline approaching: ${projectName}`,
            message: `The deadline for project \"${projectName}\" is on ${deadlineDate.toLocaleDateString()}. (${diffDays === 0 ? "Today" : diffDays + " day(s) left"})\n${project.deadline}`,
            type: "deadline",
            timestamp: new Date(),
            read: false,
          });
        }
      }
    });
    // --- END DEADLINE NOTIFICATIONS ---

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...prev, ...newNotifications]);
    }
  }

  const interval = setInterval(() => {
    // Repeat the same logic as above
    console.log('DEBUG (interval): timeEntries', timeEntries);
    console.log('DEBUG (interval): pomodoroSessions', pomodoroSessions);
    console.log('DEBUG (interval): notifications', notifications);
    let didRemove = false;
    const today = new Date().toISOString().split("T")[0];
    const hasRegularToday = timeEntries.some((entry) => entry.date === today);
    const hasPomodoroToday = pomodoroSessions.some((session) => {
      const sessionDate = new Date(session.start_time).toISOString().split("T")[0];
      return sessionDate === today;
    });
    if ((hasRegularToday || hasPomodoroToday) && notifications.some((n) => n.type === "task" && n.title === "No time tracked today")) {
      setNotifications((prev) => prev.filter((n) => !(n.type === "task" && n.title === "No time tracked today")));
      didRemove = true;
    }
    if (!didRemove) {
      let newNotifications: Notification[] = [];
      if (!hasRegularToday && !hasPomodoroToday) {
        const alreadyNotified = notifications.some(
          (n) => n.type === "task" && n.title === "No time tracked today" && !n.read
        );
        if (!alreadyNotified) {
          newNotifications.push({
            id: Date.now().toString(),
            title: "No time tracked today",
            message: "You haven't tracked any time today. Don't forget to log your work!",
            type: "task" as const,
            timestamp: new Date(),
            read: false,
          });
        }
      }
      if (isTracking && timeElapsed > 1800) {
        newNotifications.push({
          id: (Date.now() + 1).toString(),
          title: "Long session detected",
          message: "You've been working for over 30 minutes. Consider taking a break!",
          type: "reminder" as const,
          timestamp: new Date(),
          read: false,
        });
      }
      projects.forEach((project) => {
        if (!project.deadline || project.status === "Completed") return;
        const deadlineDate = new Date(project.deadline);
        const now = new Date();
        const diffTime = deadlineDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3) {
          const alreadyNotified = notifications.some(
            (n) =>
              n.type === "deadline" &&
              n.title.includes(project.name) &&
              n.message.includes(project.deadline ?? "") &&
              !n.read
          );
          if (!alreadyNotified) {
            newNotifications.push({
              id: `${project.id}-deadline-${project.deadline}`,
              title: `Project deadline approaching: ${project.name}`,
              message: `The deadline for project \"${project.name}\" is on ${deadlineDate.toLocaleDateString()}. (${diffDays === 0 ? "Today" : diffDays + " day(s) left"})\n${project.deadline}`,
              type: "deadline",
              timestamp: new Date(),
              read: false,
            });
          }
        }
      });
      if (newNotifications.length > 0) {
        setNotifications((prev) => [...prev, ...newNotifications]);
      }
    }
  }, 60000);
  return () => clearInterval(interval);
}, [timeEntries, pomodoroSessions, isTracking, timeElapsed, projects]);

// ...existing code...

  // Fetch projects, time entries, and pomodoro sessions from backend on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        console.log('fetchInitialData - starting...');
        const [projectsData, timeEntriesData, pomodorosData] = await Promise.all([
          (await import("@/utils/projects-api")).fetchProjects(),
          (await import("@/utils/time-entries-api")).fetchTimeEntries(),
          fetchPomodoroSessions()
        ])
        
        console.log('fetchInitialData - projectsData:', projectsData);
        console.log('fetchInitialData - timeEntriesData:', timeEntriesData);
        console.log('fetchInitialData - pomodorosData:', pomodorosData);
        
        // Validate projects data before setting
        const validatedProjects = Array.isArray(projectsData) ? projectsData.filter(project => {
          if (!project || typeof project !== 'object') {
            console.warn('Invalid project data:', project);
            return false;
          }
          if (!project.name || typeof project.name !== 'string') {
            console.warn('Project missing name or invalid name:', project);
            return false;
          }
          return true;
        }) : [];
        
        console.log('fetchInitialData - validatedProjects:', validatedProjects);
        setProjectsSafe(validatedProjects)
        
        // Map backend time entries to frontend format with proper project name resolution
        const mappedTimeEntries = timeEntriesData.map((entry: any) => {
          console.log('fetchInitialData - processing entry:', entry);
          // Find the project name from the projects array
          let projectName = String(entry.project);
          const projectObj = projectsData.find((p: Project) => p.id == entry.project);
          if (projectObj && projectObj.name) {
            projectName = projectObj.name;
          }
          
          const mappedEntry = {
            id: entry.id?.toString() ?? '',
            task: entry.description ?? '',
            project: projectName, // Use project name for consistency
            duration: (entry.duration || 0) * 60, // Convert minutes to seconds
            date: entry.date,
            type: entry.type || 'regular',
            billable: entry.billable || false,
            tags: [] as string[],
          };
          console.log('fetchInitialData - mapped entry:', mappedEntry);
          return mappedEntry;
        });
        
        console.log('fetchInitialData - mappedTimeEntries:', mappedTimeEntries);
        setTimeEntries(mappedTimeEntries)
        setPomodoroSessions(pomodorosData)
        
        // Store projects in localStorage for consistency
        if (typeof window !== "undefined") {
          localStorage.setItem("userProjects", JSON.stringify(projectsData))
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
      }
    }
    fetchInitialData()
  }, [])

  // Add this useEffect after the existing ones to refresh projects when returning to TIME TRACKER
  useEffect(() => {
    if (activePage === "TIME TRACKER") {
      const savedProjects = localStorage.getItem("userProjects")
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects))
      }
      // Refresh time entries when navigating to TIME TRACKER
      refreshTimeEntries()
    }
  }, [activePage])

  // Suggestion extraction for task names
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEntries = localStorage.getItem('timeEntries')
      if (savedEntries) {
        const entries = JSON.parse(savedEntries)
        setTaskNameSuggestions(Array.from(new Set(entries.map((e: any) => e.task).filter(Boolean))))
      } else {
        setTaskNameSuggestions([])
      }
    }
  }, [activePage])

  // Add a function to refresh time entries from backend
  const refreshTimeEntries = async () => {
    try {
      console.log('refreshTimeEntries - starting...');
      const { fetchTimeEntries } = await import("@/utils/time-entries-api")
      const timeEntriesData = await fetchTimeEntries()
      console.log('refreshTimeEntries - timeEntriesData:', timeEntriesData);
      
      const mappedTimeEntries = timeEntriesData.map((entry: any) => {
        console.log('refreshTimeEntries - processing entry:', entry);
        let projectName = String(entry.project);
        const projectObj = projects.find((p: Project) => p.id == entry.project);
        if (projectObj && projectObj.name) {
          projectName = projectObj.name;
        }
        
        const mappedEntry = {
          id: entry.id?.toString() ?? '',
          task: entry.description ?? '',
          project: projectName,
          duration: (entry.duration || 0) * 60, // Convert minutes to seconds
          date: entry.date,
          type: entry.type || 'regular',
          billable: entry.billable || false,
          tags: [] as string[],
        };
        console.log('refreshTimeEntries - mapped entry:', mappedEntry);
        return mappedEntry;
      });
      
      console.log('refreshTimeEntries - mappedTimeEntries:', mappedTimeEntries);
      setTimeEntries(mappedTimeEntries)
    } catch (err) {
      console.error("Failed to refresh time entries:", err)
    }
  }

  // Add periodic refresh of time entries to ensure data consistency
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if not currently tracking to avoid interrupting the timer
      if (!isTracking) {
        refreshTimeEntries()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [isTracking, projects]) // Dependencies to ensure proper refresh

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const handleStartStop = async () => {
    if (timerMode === "pomodoro") return

    const projectObj = projects.find((p: Project) => p.name === selectedProject);
    if (!selectedProject || !projectObj) {
      alert("Please select a project before starting or stopping the timer.");
      return;
    }

    if (isTracking) {
      // Stop tracking and save entry
      if (currentTask.trim() && timeElapsed > 0) {
        try {
          const { createTimeEntry } = await import("@/utils/time-entries-api")
          const entryData = {
            project: Number(projectObj.id),
            description: currentTask,
            start_time: sessionStartTime ? sessionStartTime.toTimeString().split(" ")[0] : "09:00:00",
            end_time: new Date().toTimeString().split(" ")[0],
            duration: Math.round(timeElapsed / 60),
            date: new Date().toISOString().split("T")[0],
            billable: false,
          }
          await createTimeEntry(entryData)
          
          // Refresh time entries from backend to ensure data consistency
          await refreshTimeEntries()
          
        } catch (err) {
          console.error("Failed to save time entry:", err)
        }
      }
      setIsTracking(false)
      setTimeElapsed(0)
      setCurrentTask("")
      setSelectedProject("")
      setSelectedTags([])
      setSessionStartTime(null)
    } else {
      // Start tracking
      if (currentTask.trim()) {
        setIsTracking(true)
        setSessionStartTime(new Date())
      }
    }
  }

  const handlePomodoroTimeUpdate = (seconds: number) => {
    setTimeElapsed(seconds)
  }

  const handlePomodoroComplete = async (task: string, duration: number) => {
    if (!selectedProject || !projects.find((p: Project) => p.name === selectedProject)) {
      alert("Please select a project before completing a Pomodoro entry.")
      return
    }
    if (task.trim() && duration > 0) {
      try {
        const { createTimeEntry } = await import("@/utils/time-entries-api")
        const projectObj = projects.find((p: Project) => p.name === selectedProject)
        if (!projectObj) {
          alert("Project not found!");
          return;
        }
        const entryData = {
          project: Number(projectObj.id),
          description: task,
          start_time: "09:00:00",
          end_time: "09:00:00",
          duration: Math.round(duration / 60),
          date: new Date().toISOString().split("T")[0],
          billable: false,
        }
        await createTimeEntry(entryData)
        
        // Refresh time entries from backend to ensure data consistency
        await refreshTimeEntries()
        
      } catch (err) {
        console.error("Failed to save pomodoro entry:", err)
      }
    }
  }

  // Calculate today's total time (regular + pomodoro)
  const getTodayTotal = () => {
    const today = new Date().toISOString().split("T")[0];
    const regularTotal = timeEntries.filter((entry) => entry.date === today).reduce((total, entry) => total + entry.duration, 0);
    const pomodoroTotal = pomodoroSessions.filter((session) => {
      const sessionDate = new Date(session.start_time).toISOString().split("T")[0];
      return sessionDate === today;
    }).reduce((total, session) => total + (session.duration || 0) * 60, 0); // duration is in minutes, convert to seconds
    return regularTotal + pomodoroTotal;
  }

  // Calculate this week's total time
  const getWeekTotal = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0]

    return timeEntries
      .filter((entry) => entry.date >= startOfWeekStr)
      .reduce((total, entry) => total + entry.duration, 0)
  }

  const handleProjectClick = (projectName: string) => {
    setActivePage("PROJECTS")
    // You can add additional logic here to filter or highlight the specific project
  }

  // Get recent projects with time
  const getRecentProjects = () => {
    // Debug logging
    console.log('getRecentProjects - timeEntries:', timeEntries);
    console.log('getRecentProjects - projects:', projects);
    
    // Use backend-fetched projects and time entries
    const projectTotals = timeEntries.reduce(
      (acc, entry) => {
        let projectName: string = typeof entry.project === 'string' ? entry.project : '';
        
        // Handle different project formats
        if (typeof entry.project === 'number' || (typeof entry.project === 'string' && !isNaN(Number(entry.project)))) {
          const found = projects.find((p: Project) => p.id == entry.project);
          if (found && found.name) projectName = found.name;
          else projectName = String(entry.project);
        } else if (
          typeof entry.project === 'object' &&
          entry.project !== null &&
          'name' in entry.project &&
          typeof entry.project.name === 'string'
        ) {
          projectName = entry.project.name;
        }
        
        if (!acc[projectName]) {
          acc[projectName] = 0;
        }
        acc[projectName] += entry.duration;
        return acc;
      },
      {} as Record<string, number>,
    );
    
    // Get all project names from the projects array
    const allProjects = projects.map((p: Project) => {
      // Ensure project name is always a string
      if (p && typeof p === 'object' && p.name && typeof p.name === 'string') {
        return p.name;
      }
      console.warn('Invalid project in projects array:', p);
      return 'Unknown Project';
    });
    const uniqueProjects = Array.from(new Set([...allProjects, ...Object.keys(projectTotals)]));
    
    const result = uniqueProjects
      .map((project) => {
        // Ensure project is always a string
        const projectName = typeof project === 'string' ? project : 'Unknown Project';
        return {
          project: projectName,
          duration: projectTotals[projectName] || 0,
        };
      })
      .filter((item) => item.duration > 0) // Only show projects with logged time
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 4);
    
    console.log('getRecentProjects - result:', result);
    return result;
  };

  // Helper to normalize date to YYYY-MM-DD using local time
  const toYMD = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };


  // Merge timeEntries and pomodoroSessions for weekly summary with normalized dates
  const getWeeklySummary = () => {
    const today = new Date();
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + 1 + i); // Monday to Sunday
      weekDays.push({
        day: date.toLocaleDateString("en-US", { weekday: "long" }),
        date: toYMD(date), // Use local date string
        isToday: toYMD(date) === toYMD(today),
      });
    }
    return weekDays.map((day) => {
      const regularTotal = timeEntries
        .filter((entry) => entry.date === day.date)
        .reduce((total, entry) => total + entry.duration, 0);
      const pomodoroTotal = pomodoroSessions
        .filter((session) => toYMD(session.start_time) === day.date)
        .reduce((total, session) => total + ((session.duration || 0) * 60), 0); // duration is in minutes, convert to seconds
      const todayExtra = day.isToday && isTracking ? timeElapsed : 0;
      const final = regularTotal + pomodoroTotal + todayExtra;
      return {
        ...day,
        duration: final,
      };
    });
  };

  const handleSidebarItemClick = (label: string) => {
    setActivePage(label)
    if (label === "CLIENTS") {
      setActiveNavItem("Clients")
    } else if (label === "TIME TRACKER") {
      setActiveNavItem("Home")
    } else if (label === "REPORTS") {
      setActiveNavItem("Reports")
    } else if (label === "PROJECTS") {
      setActiveNavItem("Projects")
    } else if (label === "SETTINGS") {
      setActiveNavItem("Settings")
    } else if (label === "CALENDAR") {
      setActiveNavItem("Home")
    } else if (label === "TAGS") {
      setActiveNavItem("Home")
    }
  }

  const sidebarItems = [
    { icon: Timer, label: "TIME TRACKER", active: activePage === "TIME TRACKER" },
    { icon: Calendar, label: "CALENDAR", active: activePage === "CALENDAR" },
    { icon: BarChart3, label: "REPORTS", hasSubmenu: true, active: activePage === "REPORTS" },
    { icon: FolderOpen, label: "PROJECTS", active: activePage === "PROJECTS" },
    { icon: UserCheck, label: "CLIENTS", active: activePage === "CLIENTS" },
    { icon: Tag, label: "TAGS", active: activePage === "TAGS" },
    { icon: Settings, label: "SETTINGS", active: activePage === "SETTINGS" },
  ]

  const navItems = ["Home", "Reports", "Projects", "Clients", "Settings"]

  // Hydration-safe recentProjects state
  const [recentProjects, setRecentProjects] = useState<any[] | null>(null);

  useEffect(() => {
    // Defensive: always set to array if getRecentProjects returns undefined/null
    const recents = getRecentProjects();
    console.log('useEffect - recents from getRecentProjects:', recents);
    console.log('useEffect - recents type:', typeof recents);
    console.log('useEffect - recents isArray:', Array.isArray(recents));
    
    if (Array.isArray(recents)) {
      // Additional validation for each item
      const validatedRecents = recents.map((item, index) => {
        console.log(`useEffect - validating item ${index}:`, item);
        if (item && typeof item === 'object') {
          return {
            project: typeof item.project === 'string' ? item.project : 'Unknown Project',
            duration: typeof item.duration === 'number' ? item.duration : 0,
          };
        }
        console.warn(`useEffect - invalid item at index ${index}:`, item);
        return null;
      }).filter(Boolean);
      
      console.log('useEffect - validated recents:', validatedRecents);
      setRecentProjects(validatedRecents);
    } else {
      console.warn('useEffect - getRecentProjects did not return an array:', recents);
      setRecentProjects([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeEntries, projects]); // <-- add 'projects' as dependency

  const weeklySummary = getWeeklySummary()
  const todayTotal = getTodayTotal()
  const weekTotal = getWeekTotal()

  // Safe setter for projects to prevent invalid objects
  const setProjectsSafe = (newProjects: Project[]) => {
    if (!Array.isArray(newProjects)) {
      console.warn('setProjectsSafe - newProjects is not an array:', newProjects);
      setProjects([]);
      return;
    }
    
    const validatedProjects = newProjects.filter(project => {
      if (!project || typeof project !== 'object') {
        console.warn('setProjectsSafe - invalid project:', project);
        return false;
      }
      if (!project.name || typeof project.name !== 'string') {
        console.warn('setProjectsSafe - project missing name or invalid name:', project);
        return false;
      }
      return true;
    });
    
    console.log('setProjectsSafe - validated projects:', validatedProjects);
    setProjects(validatedProjects);
  };

  const renderMainContent = () => {
    switch (activePage) {
      case "CLIENTS":
        return <ClientsPage />
      case "TEAM":
        return <ReportsPage />
      case "REPORTS":
        return <ReportsPage />
      case "PROJECTS":
        return <ProjectsPage />
      case "SETTINGS":
        return <SettingsPage />
      case "CALENDAR":
        return <CalendarView />
      case "TAGS":
        return <TagsPage />
      case "TIME TRACKER":
      default:
        return (
          <div className="flex-1 p-6">
            <div className="w-[90%] mx-auto space-y-6">
              {/* Today's Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {todayTotal > 0 ? formatDuration(todayTotal + timeElapsed) : "0h 0m"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isTracking ? "Currently tracking..." : "Start tracking to see progress"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Week</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {weekTotal > 0 ? formatDuration(weekTotal + timeElapsed) : "0h 0m"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {weekTotal > 0 ? `${timeEntries.length} sessions logged` : "No time logged yet"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {recentProjects === null ? (
                        <span className="text-gray-400">...</span>
                      ) : (
                        Array.isArray(recentProjects) ? recentProjects.length : 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {recentProjects === null
                        ? "Loading..."
                        : Array.isArray(recentProjects) && recentProjects.length > 0
                        ? "Projects with logged time"
                        : "No projects yet"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <button onClick={() => setActivePage("SETTINGS")} className="cursor-pointer">
                      <DollarSign className="h-4 w-4 text-muted-foreground hover:text-purple-600 transition-colors" />
                    </button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{timeEntries.length + pomodoroSessions.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {pomodoroSessions.length} Pomodoro sessions
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Timer Section */}
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Time Tracker</CardTitle>
                      <CardDescription>Track your work time with regular timer or Pomodoro technique</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={timerMode === "regular" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimerMode("regular")}
                        className="flex items-center"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Regular
                      </Button>
                      <Button
                        variant={timerMode === "pomodoro" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimerMode("pomodoro")}
                        className="flex items-center"
                      >
                        <Coffee className="h-4 w-4 mr-1" />
                        Pomodoro
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {timerMode === "regular" ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Input
                            placeholder="What are you working on?"
                            value={currentTask}
                            onChange={(e) => setCurrentTask(e.target.value)}
                            className="text-lg"
                            list="task-name-suggestions"
                          />
                          <datalist id="task-name-suggestions">
                            {taskNameSuggestions.map((name) => (
                              <option key={name} value={name} />
                            ))}
                          </datalist>
                        </div>

                        <div className="relative">
                          <Button
                            variant="ghost"
                            className="flex items-center space-x-1 text-purple-500 project-button"
                            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                          >
                            <FolderOpen className="h-5 w-5" />
                            <span>{selectedProject || "Project"}</span>
                          </Button>

                          {showProjectDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto project-dropdown">
                              <div className="p-2">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1">
                                  Select Project
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedProject("")
                                    setShowProjectDropdown(false)
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                >
                                  No Project
                                </button>
                                {projects.length > 0 ? (
                                  projects.map((project) => {
                                    // Ensure project name and client are strings
                                    const projectName = typeof project.name === 'string' ? project.name : 'Unnamed Project';
                                    const projectClient = typeof project.client === 'object' && project.client !== null ? project.client.name : 'No client';
                                    
                                    return (
                                    <button
                                      key={project.id}
                                      onClick={() => {
                                          setSelectedProject(projectName)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center justify-between"
                                    >
                                        <span>{projectName}</span>
                                        <span className="text-xs text-gray-500">{projectClient}</span>
                                    </button>
                                    );
                                  })
                                ) : (
                                  <div className="px-3 py-4 text-center text-gray-500">
                                    <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No projects yet</p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2 text-purple-600 border-purple-600 hover:bg-purple-50"
                                      onClick={() => {
                                        setActivePage("PROJECTS")
                                        setShowProjectDropdown(false)
                                      }}
                                    >
                                      Create Project
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          className="text-gray-400 hover:text-purple-500"
                          onClick={() => setActivePage("TAGS")}
                        >
                          <Tag className="h-5 w-5" />
                        </Button>

                        <Button
                          variant="ghost"
                          className="text-gray-400 hover:text-purple-500"
                          onClick={() => setActivePage("SETTINGS")}
                        >
                          <DollarSign className="h-5 w-5" />
                        </Button>

                        <div className="text-2xl font-mono text-gray-700 min-w-[120px] text-center">
                          {formatTime(timeElapsed)}
                        </div>

                        <Button
                          onClick={handleStartStop}
                          disabled={!currentTask.trim() || !selectedProject || !projects.find((p: Project) => p.name === selectedProject) && !isTracking}
                          className={`px-8 py-2 font-semibold ${
                            isTracking
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white disabled:opacity-50"
                          }`}
                        >
                          {isTracking ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              STOP
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              START
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <PomodoroTimer onTimeUpdate={handlePomodoroTimeUpdate} onComplete={handlePomodoroComplete} />
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Recent Projects</CardTitle>
                    <CardDescription>Your most active projects this week</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentProjects === null ? (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Loading...</p>
                      </div>
                    ) : Array.isArray(recentProjects) && recentProjects.length > 0 ? (
                      recentProjects.map((project, index) => {
                        // Comprehensive validation to ensure no objects are rendered
                        if (!project || typeof project !== 'object') {
                          console.warn('Invalid project data:', project);
                          return null;
                        }
                        
                        // Ensure project name is always a string
                        let projectName = 'Unknown Project';
                        if (project.project) {
                          if (typeof project.project === 'string') {
                            projectName = project.project;
                          } else if (typeof project.project === 'object' && project.project.name) {
                            projectName = String(project.project.name);
                          } else {
                            projectName = String(project.project);
                          }
                        }
                        
                        // Ensure duration is a number
                        const duration = typeof project.duration === 'number' ? project.duration : 0;
                        
                        return (
                        <div
                          key={index}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            onClick={() => handleProjectClick(projectName)}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500"][index % 4]
                              }`}
                            ></div>
                              <span className="font-medium">{projectName}</span>
                          </div>
                            <Badge variant="secondary">{formatDuration(duration)}</Badge>
                        </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No projects tracked yet</p>
                        <p className="text-xs text-gray-400 mt-1">Start tracking time to see your projects here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>This Week's Summary</CardTitle>
                    <CardDescription>Your daily productivity overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {weeklySummary.some((day) => day.duration > 0) ? (
                      <div className="space-y-2">
                        {weeklySummary.map((day, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className={day.isToday ? "text-purple-600 font-medium" : ""}>
                              {day.day}
                              {day.isToday && " (Today)"}
                            </span>
                            <span className={`font-medium ${day.isToday ? "text-purple-600" : ""}`}>
                              {day.duration > 0 ? formatDuration(day.duration) : "0m"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No time logged this week</p>
                        <p className="text-xs text-gray-400 mt-1">Start your first session to see daily summaries</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setActivePage("CALENDAR")}
                    >
                      <Calendar className="h-6 w-6" />
                      <span className="text-sm">View Calendar</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setActivePage("REPORTS")}
                    >
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-sm">Reports</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setActivePage("PROJECTS")}
                    >
                      <FolderOpen className="h-6 w-6" />
                      <span className="text-sm">Projects</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setActivePage("TAGS")}
                    >
                      <Tag className="h-6 w-6" />
                      <span className="text-sm">Tags</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-300 to-blue-400 flex">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen((open) => !open)}
        className="fixed top-4 left-4 z-50 bg-white/90 border border-gray-200 rounded-full shadow-md p-2 transition-colors hover:bg-purple-100 focus:outline-none"
        style={{ display: sidebarOpen ? 'none' : 'block' }}
        aria-label="Open sidebar"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </button>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 bg-white/90 backdrop-blur-sm border-r border-white/20 flex flex-col`}
        style={{ boxShadow: sidebarOpen ? '2px 0 8px rgba(0,0,0,0.04)' : 'none' }}
      >
        {/* Close Button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-[-40px] z-50 bg-white/90 border border-gray-200 rounded-full shadow-md p-2 transition-colors hover:bg-purple-100 focus:outline-none"
          aria-label="Close sidebar"
          style={{ display: sidebarOpen ? 'block' : 'none' }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        {/* Logo */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg px-3 py-2">
              <Timer className="h-5 w-5 text-white" />
              <CheckSquare className="h-4 w-4 text-white" />
              <span className="text-white font-bold text-lg">ATB Tracker</span>
            </div>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {sidebarItems.map((item, index) => (
              <div key={index}>
                <button
                  onClick={() => handleSidebarItemClick(item.label)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    item.active
                      ? "bg-purple-100 text-purple-600 border-l-4 border-purple-600"
                      : "text-gray-600 hover:bg-purple-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
                {index === 2 && (
                  <div className="mt-4 mb-2">
                    <div className="text-xs font-semibold text-purple-500 uppercase tracking-wider px-3">ANALYZE</div>
                  </div>
                )}
                {index === 4 && (
                  <div className="mt-4 mb-2">
                    <div className="text-xs font-semibold text-purple-500 uppercase tracking-wider px-3">MANAGE</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
        {/* Notification and Profile Icons at Bottom */}
        <div className="flex flex-col items-start space-y-4 p-4 border-t border-white/20">
          {/* Notifications Dropdown */}
          <div className="relative flex items-center space-x-2">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative cursor-pointer">
              <div
                className={`w-10 h-10 ${notifications.filter((n) => !n.read).length > 0 ? "bg-orange-500" : "bg-gray-400"} rounded-full flex items-center justify-center`}
              >
                <span className="text-white text-base font-bold">
                  {notifications.filter((n) => !n.read).length || "0"}
                </span>
              </div>
            </button>
            <span className="text-gray-600 text-sm font-medium">Notifications</span>
            {showNotifications && (
              <div className="absolute left-0 bottom-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No notifications yet</p>
                      <p className="text-sm text-gray-400 mt-1">We'll notify you about deadlines and reminders</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === "deadline"
                                ? "bg-red-500"
                                : notification.type === "task"
                                  ? "bg-orange-500"
                                  : "bg-blue-500"
                            }`}
                          ></div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-800">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200">
                    <button
                      onClick={() => setNotifications([])}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Profile Dropdown */}
          <div className="relative flex items-center space-x-2 mt-2">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-10 h-10 bg-gradient-to-r from-purple-800 to-blue-800 rounded-full flex items-center justify-center cursor-pointer border-2 border-white/20 hover:border-white/40 transition-colors"
            >
              <span className="text-white text-base font-bold">{profileData.initials}</span>
            </button>
            <span className="text-gray-600 text-sm font-medium">Profile</span>
            {showProfileDropdown && (
              <div className="absolute left-0 bottom-12 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                style={{ pointerEvents: 'auto', zIndex: 9999 }}
              >
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{profileData.initials}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{profileData.name}</h3>
                      <p className="text-sm text-gray-600">{profileData.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Today's Time:</span>
                      <span className="font-medium">
                        {todayTotal > 0 ? formatDuration(todayTotal + timeElapsed) : "0h 0m"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">This Week:</span>
                      <span className="font-medium">
                        {weekTotal > 0 ? formatDuration(weekTotal + timeElapsed) : "0h 0m"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Sessions:</span>
                      <span className="font-medium">{timeEntries.length}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center mt-1"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Logout Link */}
        <div className="p-4 border-t border-white/20">
          <NavigationLink
            href="/signup"
            variant="outline"
            className="w-full text-purple-600 border-purple-600 hover:bg-purple-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Back to Sign Up
          </NavigationLink>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Removed the top navbar completely */}
        {renderMainContent()}
      </div>
    </div>
  )
}
