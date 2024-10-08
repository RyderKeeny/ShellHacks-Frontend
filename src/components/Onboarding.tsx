"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import PlayAudioButton from "./PlayAudioButton"
import { navigate } from "astro:transitions/client"
import useSubmitCards from "@/hooks/useSubmitCards"
import { getUserId } from "@/lib/utils"

export default function OnboardingProcess() {
  const [showSlider, setShowSlider] = useState(true)
  const [sliderValue, setSliderValue] = useState(5)
  const [progressValue, setProgressValue] = useState(0)
  const incrementAmount = 35
  const [cardContentIndex, setCardContentIndex] = useState(0)
  const [words, setWords] = useState<Set<string>>(new Set())
  const [highlightedWords, setHighlightedWords] = useState<string[]>([])
  const [allHighlightedWords, setAllHighlightedWords] = useState<string[]>([])
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const { submitCards, isLoading, error } = useSubmitCards();

  async function fetchParagraphs() {
    try {
      const response = await fetch('http://3.147.36.237:3000/api/onboard-gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: sliderValue }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      setParagraphs(data.paragraphs[0].Content.Parts)

      data.paragraphs.forEach((section: any) => {
        section.Content.Parts.forEach((paragraph: string) => {
          paragraph.split(" ") // Split by one or more spaces
            .forEach(word => {
              words.add(word);
            });
        });
      });

      console.log(words);
    } catch (error) {
      console.error('Error fetching paragraphs:', error)
      setParagraphs(['An error occurred while fetching content. Please try again.'])
    }
  }

  function handleSliderChange(value: number[]) {
    setSliderValue(value[0])
  }

  function handleSliderButtonClick() {
    fetchParagraphs()
    setShowSlider(false)
  }

  async function handleProgressButtonClick() {
    ``
    setAllHighlightedWords((prev) => [...new Set([...prev, ...highlightedWords])])
    try {
      const response = await fetch('http://3.147.36.237:3000/api/onboard-gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: sliderValue }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      setParagraphs(data.paragraphs[0].Content.Parts)

      data.paragraphs.forEach((section: any) => {
        section.Content.Parts.forEach((paragraph: string) => {
          paragraph.split(" ") // Split by one or more spaces
            .forEach(word => {
              words.add(word);
            });
        });
      });

      console.log(words);
    } catch (error) {
      console.error('Error fetching paragraphs:', error)
      setParagraphs(['An error occurred while fetching content. Please try again.'])
    }
    if (progressValue < 100) {
      setProgressValue((prevValue) => Math.min(prevValue + incrementAmount, 100))
      setCardContentIndex((prevIndex) => (prevIndex + 1) % paragraphs.length)
      setHighlightedWords([])
    }
  }

  function toggleHighlight(word: string) {
    setHighlightedWords((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    )
  }

  function renderCard(content: string) {
    const words = content.split(/\b(?=\w)/).map((word, i) => (
      <span
        key={i}
        onClick={() => toggleHighlight(word.replace(/[^\w\s]/g, ""))}  // Remove punctuation from the word when clicking
        className={`cursor-pointer inline-block mr-1 mb-1 rounded-md hover:underline ${highlightedWords.includes(word.replace(/[^\w\s]/g, "")) ? "bg-orange-200" : ""
          }`}
      >
        {word}
      </span>
    ));

    return (
      <Card className="w-full max-w-3xl h-[300px] shadow-md">
        <CardContent className="p-6 h-full overflow-y-auto, mx-auto flex w-full flex-wrap justify-center">
          <div className="text-center w-full leading-relaxed text-base whitespace-normal break-words mb-auto">
            {words}
          </div>

          <div className="mt-auto">
            <PlayAudioButton text={words.map((word) => word.props.children).join(" ")} />
          </div>
        </CardContent>
      </Card>
    )
  }
  async function handleCompletion() {
    const id = await getUserId();
    if (id === undefined) {
      console.error("User ID not found")
      setParagraphs(['An error occurred while trying to submit. Please try again.'])
    } else {
      const difference = getUniqueWords(Array.from(words), allHighlightedWords);
      console.log(difference);
      submitCards(id, difference.map((word) => ({ word, proficiency: null })), difference.map(() => true))
      navigate("/dashboard")
    }
  }

  function getUniqueWords(array1: any[], array2: any[]) {
    const uniqueToArray1 = array1.filter(word => !array2.includes(word));
    const uniqueToArray2 = array2.filter(word => !array1.includes(word));
    return [...uniqueToArray1, ...uniqueToArray2];
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 space-y-6">
      {showSlider ? (
        <div className="text-center mt-20 w-full max-w-md h-full gap-4 flex flex-wrap justify-center">
          <h2 className="mb-6 text-2xl">What is your current level in the language you want to learn?</h2>
          <Slider
            value={[sliderValue]}
            onValueChange={handleSliderChange}
            max={100}
            step={1}
          />
          <Button onClick={handleSliderButtonClick} className="mt-6">
            Confirm Knowledge Level
          </Button>
        </div>
      ) : (
        <div className="text-center w-full max-w-3xl space-y-6">
          <div className="text-lg p-2">Select words you are not very familiar with</div>
          <Progress value={progressValue} className="w-full" />

          {paragraphs.length > 0 ? renderCard(paragraphs[cardContentIndex]) : <Card className="w-full max-w-3xl h-[300px] shadow-md" />}

          {progressValue < 100 ? (
            <Button onClick={handleProgressButtonClick}>
              Continue
            </Button>
          ) : (
            <Button className="bg-green-500 hover:bg-green-600" onClick={handleCompletion}>
              Complete
            </Button>
          )}

          {/* <div className="w-full max-w-3xl">
            <h3 className="text-lg font-bold">Highlighted Words:</h3>
            <p className="mt-2 break-words">
              {allHighlightedWords.length > 0
                ? allHighlightedWords.join(", ")
                : "No words highlighted yet"}
            </p>
          </div> */}
        </div>
      )}
    </div>
  )
}