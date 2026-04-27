import { useEffect, useState } from "react";
import {
  MOCK_ACTIVITY,
  MOCK_CLAIMS,
  MOCK_JURY_ASSIGNMENTS,
  MOCK_POOL,
} from "./mockDatabase";

export function useLivePool() {
  const [pool, setPool] = useState(MOCK_POOL);

  useEffect(() => {
    const interval = setInterval(() => {
      setPool((prev) => ({
        ...prev,
        totalReserve: prev.totalReserve + Math.floor((Math.random() - 0.4) * 20000),
        stability: Math.min(99, Math.max(60, prev.stability + (Math.random() - 0.5) * 2)),
        activeClaims: Math.max(30, prev.activeClaims + (Math.random() > 0.5 ? 1 : -1)),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return pool;
}

export function useLiveActivity() {
  const ACTIVITY_POOL = [
    "New claim submitted by mesh_relay_3",
    "Jury voted on case #C1776761918",
    "Pool reserve increased by 0.8%",
    "claim_node_7 reputation updated to 445",
    "Case #C1776763980 approved by jury",
    "New juror joined: cipher_peer_12",
    "Emergency claim flagged for fast-track",
    "Peer review completed on 2 cases",
    "Reserve recovered by 1.2%",
    "3 claims moved to re-evaluation",
  ];

  const [activity, setActivity] = useState(MOCK_ACTIVITY);

  useEffect(() => {
    const interval = setInterval(() => {
      const newItem = {
        message: ACTIVITY_POOL[Math.floor(Math.random() * ACTIVITY_POOL.length)],
        time: "just now",
      };
      setActivity((prev) => [newItem, ...prev.slice(0, 6)]);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return activity;
}

export function useLiveJuryProgress(caseId) {
  const [assignments, setAssignments] = useState(MOCK_JURY_ASSIGNMENTS);

  useEffect(() => {
    const interval = setInterval(() => {
      setAssignments((prev) =>
        prev.map((a) => {
          if (a.caseId !== caseId) return a;
          const juryPanel = Number(a.juryPanel || a.jurorIds?.length || 8);
          const votedNow = Number(a.juryVoted || 0);
          const newVoted = Math.min(juryPanel, votedNow + (Math.random() > 0.7 ? 1 : 0));
          const claim = MOCK_CLAIMS.find((c) => c.id === caseId);
          if (claim) {
            claim.juryVoted = newVoted;
            claim.juryPanel = juryPanel;
            claim.progress = Math.min(100, Math.round((newVoted / juryPanel) * 100));
          }
          return { ...a, juryPanel, juryVoted: newVoted };
        })
      );
    }, 15000);
    return () => clearInterval(interval);
  }, [caseId]);

  return assignments.find((a) => a.caseId === caseId);
}
