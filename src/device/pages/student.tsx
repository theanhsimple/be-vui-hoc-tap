"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PlacementPlayer } from "@/components/student/discover/PlacementPlayer";
import { HomeScreen } from "@/components/student/home/HomeScreen";
import { LessonIntroScreen } from "@/components/student/lessons/LessonIntroScreen";
import { LessonPlayer } from "@/components/student/lessons/LessonPlayer";
import {
  type LessonOutcome,
  LessonResultScreen,
} from "@/components/student/lessons/LessonResultScreen";
import { ProfilesScreen } from "@/components/student/ProfilesScreen";
import { RewardsScreen } from "@/components/student/rewards/RewardsScreen";
import { StudentLoading } from "@/components/student/StudentLoading";
import { ExploreScreen } from "@/components/student/worlds/ExploreScreen";
import { WorldDetailScreen } from "@/components/student/worlds/WorldDetailScreen";
import { ageLabel } from "@/features/family/age";
import type { SessionState } from "@/features/learning/backend/overview";
import type { PlacementRun } from "@/features/learning/backend/placement";
import { findLesson, findWorld } from "@/features/learning/content/catalog";

import { deviceContent } from "../content";
import * as E from "../engine";
import { getDeviceState, useDeviceState } from "../store";
import { DeviceStudent } from "../student-view";

const content = () => deviceContent();

export function DeviceProfiles() {
  const state = useDeviceState();
  if (!state) return <StudentLoading />;
  return (
    <ProfilesScreen
      selectedId={state.selectedChildId ?? undefined}
      profiles={state.children
        .filter((c) => c.status === "active")
        .map((c) => ({
          id: c.id,
          nickname: c.nickname,
          avatar: c.avatarKey as never,
          ageLabel: ageLabel(c.birthYear) || undefined,
        }))}
    />
  );
}

export function DeviceHome() {
  return (
    <DeviceStudent withDailyPlan>
      {() => <HomeScreen catalog={content().catalog} />}
    </DeviceStudent>
  );
}

export function DeviceExplore() {
  return (
    <DeviceStudent>
      {() => <ExploreScreen catalog={content().catalog} />}
    </DeviceStudent>
  );
}

export function DeviceRewards() {
  return (
    <DeviceStudent>
      {() => <RewardsScreen catalog={content().catalog} />}
    </DeviceStudent>
  );
}

export function DeviceWorld({ moduleId }: { moduleId: string }) {
  const world = findWorld(content().catalog, moduleId)!;
  return (
    <DeviceStudent>{() => <WorldDetailScreen world={world} />}</DeviceStudent>
  );
}

function lessonParts(lessonId: string) {
  const catalog = content().catalog;
  const summary = findLesson(catalog, lessonId)!;
  const world = findWorld(catalog, summary.worldId)!;
  return { summary, world, lesson: content().lesson(lessonId)! };
}

export function DeviceLessonIntro({ lessonId }: { lessonId: string }) {
  const { summary, world } = lessonParts(lessonId);
  return (
    <DeviceStudent>
      {() => <LessonIntroScreen lesson={summary} world={world} />}
    </DeviceStudent>
  );
}

/**
 * The player renders an EXISTING session (started on the intro screen). It is
 * captured once, so finishing the lesson (which closes the session) does not
 * bounce the child back to the intro before the result opens.
 */
export function DeviceLessonPlay({ lessonId }: { lessonId: string }) {
  const { lesson, world } = lessonParts(lessonId);
  const router = useRouter();
  const state = useDeviceState();
  const [session, setSession] = useState<SessionState | null | undefined>();
  // Captured once when local data is available (derived state, set in render).
  if (state && session === undefined) {
    const child = state.selectedChildId;
    setSession(
      child ? E.activeSession(state, content(), child, lessonId) : null,
    );
  }
  useEffect(() => {
    if (session === null) router.replace(`/student/lessons/${lessonId}`);
  }, [session, lessonId, router]);

  if (!session) return <StudentLoading />;
  return (
    <DeviceStudent>
      {() => (
        <LessonPlayer
          key={session.sessionId}
          lesson={lesson}
          world={world}
          session={session}
        />
      )}
    </DeviceStudent>
  );
}

export function DeviceLessonResult({ lessonId }: { lessonId: string }) {
  const { summary, world } = lessonParts(lessonId);
  const sessionId = useSearchParams().get("session");
  return (
    <DeviceStudent>
      {(view) => {
        let result: LessonOutcome | null = null;
        const r = sessionId
          ? E.sessionResult(getDeviceState(), view.child.id, sessionId)
          : null;
        if (
          r &&
          r.status === "completed" &&
          r.lessonId === lessonId &&
          r.completedAt
        )
          result = { ...r, completedAt: r.completedAt };
        if (!result) {
          const record = view.progress.lessons[lessonId];
          if (record)
            result = { ...record.last, completedAt: record.lastCompletedAt };
        }
        return (
          <LessonResultScreen lesson={summary} world={world} result={result} />
        );
      }}
    </DeviceStudent>
  );
}

export function DeviceDiscover() {
  const router = useRouter();
  const state = useDeviceState();
  const [run, setRun] = useState<PlacementRun | null | undefined>();
  if (state && run === undefined) {
    const child = state.selectedChildId;
    setRun(child ? E.activePlacement(state, child) : null);
  }
  useEffect(() => {
    if (run === null) router.replace("/student/home");
  }, [run, router]);

  if (!run) return <StudentLoading />;
  return (
    <DeviceStudent>
      {(view) => (
        <PlacementPlayer
          key={run.runId}
          run={run}
          questions={content().placement.questions}
          childId={view.child.id}
        />
      )}
    </DeviceStudent>
  );
}
