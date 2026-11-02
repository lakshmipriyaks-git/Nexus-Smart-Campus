import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useTasks } from '../hooks/useTasks';
import { useEvents } from '../hooks/useEvents';
import { useClasses } from '../hooks/useClasses';
import { useCourses } from '../hooks/useCourses';
import { useResources } from '../hooks/useResources';
import { useAttendance } from '../hooks/useAttendance';
import { useGrading } from '../hooks/useGrading';
import { useUsers } from '../hooks/useUsers';
import { useInterventions } from '../hooks/useInterventions';
import { useNotifications } from '../hooks/useNotifications';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();

    const tasksData = useTasks(user);
    const eventsData = useEvents(user);
    const classesData = useClasses(user);
    const coursesData = useCourses(user);
    const resourcesData = useResources(user);
    const attendanceData = useAttendance(user);
    const gradingData = useGrading(user);
    const usersData = useUsers();
    const platformStatsData = usersData.usePlatformStats(user);
    const interventionsData = useInterventions(user);
    const notificationsData = useNotifications(user);

    const value = {
        ...tasksData,
        ...eventsData,
        ...classesData,
        ...coursesData,
        ...resourcesData,
        ...attendanceData,
        ...gradingData,
        ...usersData,
        platformStats: platformStatsData.stats,
        platformStatsLoading: platformStatsData.loading,
        ...interventionsData,
        ...notificationsData,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
